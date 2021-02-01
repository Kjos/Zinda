using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace Zinda
{
    class Server
    {
        private HttpServer wss;

        public Server()
        {
            string pwdFile = "mypwd.txt";
            if (!File.Exists(pwdFile))
            {
                File.WriteAllText(pwdFile, Util.GenerateToken(32));
            }

            string password = File.ReadAllText(pwdFile);

            string certFile = "mycert.pfx";
            if (!File.Exists(certFile))
            {
                File.WriteAllBytes("mycert.pfx", PFXGenerator.GeneratePfx("kchatty", password));
            }

            this.wss = new HttpServer(IPAddress.Any, 5000, true);
            this.wss.OnGet += (object sender, HttpRequestEventArgs e) =>
            {
                var req = e.Request;
                var res = e.Response;

                var path = req.RawUrl;
                if (path == "/")
                    path += "index.html";

                path = "www/" + path;

                if (!File.Exists(path))
                {
                    res.StatusCode = (int)HttpStatusCode.NotFound;
                    return;
                }

                byte[] contents = File.ReadAllBytes(path);

                if (path.EndsWith(".html"))
                {
                    res.ContentType = "text/html";
                    res.ContentEncoding = Encoding.UTF8;
                }
                else if (path.EndsWith(".js"))
                {
                    res.ContentType = "application/javascript";
                    res.ContentEncoding = Encoding.UTF8;
                }
                else if (path.EndsWith(".css"))
                {
                    res.ContentType = "text/css";
                    res.ContentEncoding = Encoding.UTF8;
                }

                res.ContentLength64 = contents.LongLength;
                res.Close(contents, true);
            };
            this.wss.AddWebSocketService<Session>("/kchatty");
            this.wss.Realm = "kchatty";
            this.wss.KeepClean = true;
            var x509 = new X509Certificate2("mycert.pfx", password);
            this.wss.SslConfiguration.ServerCertificate = x509;
            this.wss.Log.Level = LogLevel.Trace;
        }

        public void Start()
        {

            this.wss.Start();
            if (this.wss.IsListening)
            {
                Console.WriteLine("Listening on port {0}, and providing WebSocket services:", this.wss.Port);
                foreach (var path in this.wss.WebSocketServices.Paths)
                    Console.WriteLine("- {0}", path);
            }

            Thread thread = new Thread(() =>
            {
                if (this.wss.WebSocketServices.InternalTryGetServiceHost("/ws", out WebSocketServiceHost host))
                {
                    while (this.wss.IsListening)
                    {

                        Session.ForceSendAudio(host.Sessions.Sessions.Cast<Session>());
                        Thread.Sleep(Constants.AUDIO_UPDATE_MS);
                    }
                }
            });
            thread.Start();
        }

        public void Stop()
        {
            this.wss.Stop();
        }
    }
}
