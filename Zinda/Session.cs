using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace Zinda
{
    class Session : WebSocketBehavior
    {
        public IEnumerable<Session> All
        {
            get
            {
                return this.Sessions.Sessions.Cast<Session>();
            }
        }

        public int Count
        {
            get {
                return this.Sessions.Count;
            }
        }

        private int MaximumJpegSize
        {
            get
            {
                return width * height * 3;
            }
        }

        private static Random Random = new Random();
        private static int NumberCounter = 0;

        private int playerId;
        private bool sendingAudio = false;

        private static int width = 320, height = 240, fps = 60, fpsMs = 1000 / fps;

        public Session()
        {
            this.playerId = NumberCounter++;
        }

        private void GetIp(Session player)
        {
        }

        private void Broadcast(byte[] data)
        {
            this.Sessions.Broadcast(data);
        }

        private long lastVideoTime = 0;
        private void SendVideo(Session exclude, byte[] data)
        {
            long now = DateTime.Now.Ticks / TimeSpan.TicksPerMillisecond;
            if (now - lastVideoTime < fpsMs) return;

            if (data.Length < 8 || data.Length > MaximumJpegSize) return;

            foreach (Session player in this.All)
            {
                if (player.ConnectionState != WebSocketState.Open) continue;

                if (player != exclude)
                {
                    player.Send(data);
                }
                        
            }

            lastVideoTime = now;
        }

        private bool sendAudio = false;
        public static void ForceSendAudio(IEnumerable<Session> sessions)
        {
            foreach (Session p in sessions)
            {
                p.sendAudio = true;
            }
        }

        private sbyte[] audioBuffer = new sbyte[5000];
        private int audioCnt = 0;
        private int audioMax = 0;

        private void SendAudio(Session exclude, byte[] data)
        {
            if (data.Length > audioBuffer.Length) return;

            foreach (Session player in this.All)
            {
                if (exclude == player || player.ConnectionState != WebSocketState.Open)
                {
                    continue;
                }

                player.audioCnt++;
                player.audioMax = Math.Max(player.audioMax, data.Length);
                for (int i = 1; i < data.Length; i++)
                {
                    sbyte m = (sbyte)Math.Max(-127, Math.Min(127, (int)player.audioBuffer[i] + (int)((sbyte)data[i])));
                    player.audioBuffer[i] = m;
                }

                if ((player.audioCnt >= this.All.Count() - 1 || player.sendAudio) && player.audioMax > 1 && !player.sendingAudio)
                {
                    player.sendingAudio = true;

                    byte[] send = new byte[player.audioMax];
                    send[0] = 1;
                    for (int i = 1; i < player.audioMax; i++)
                    {
                        send[i] = (byte)player.audioBuffer[i];
                        player.audioBuffer[i] = 0;
                    }
                    player.SendAsync(send, (e) => { player.sendingAudio = false; });
                    player.audioMax = 0;
                    player.audioCnt = 0;
                    player.sendAudio = false;
                }
            }
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            byte[] data = e.RawData;
            int messageType = Util.ByteToInt(data, 0);
            switch (messageType)
            {
                // Video
                case 0:
                    this.SendVideo(this, data);
                    break;
                // Audio
                case 1:
                    this.SendAudio(this, data);
                    break;
                // Chat
                case 2:
                    break;
                // Login
                case 3:
                    break;
                // Log out
                case 4:
                    break;
                // Keyframes request
                case 5:
                    if (data.Length == 1) this.Broadcast(data);
                    break;
                // DTMF
                case 6:
                    if (data.Length == 3) this.Broadcast(data);
                    break;
            }
        }

        protected override void OnClose(CloseEventArgs e)
        {
            Console.WriteLine("Player " + this.playerId + " logged out.");
            this.SubmitLoginLogout(false);
        }

        protected override void OnOpen()
        {
            if (this.ConnectionState != WebSocketState.Open) return;

            this.playerId = Math.Abs(Random.Next());
            for (int i = 0; i < Count; i++)
            {
                if (!this.All.Contains((x) => x.playerId == i))
                {
                    this.playerId = i;
                    break;
                }
            }
            Console.WriteLine("Player " + this.playerId + " logged in.");
            this.SubmitLoginLogout(true);
        }

        private void SubmitLoginLogout(bool stateIn)
        {
            byte[] login = new byte[5];
            login[0] = (byte)(stateIn ? 3 : 4);
            Util.IntToByteArray(this.playerId, login, 1);
            if (stateIn)
            {
                this.Send(login);
            }
            else
            {
                this.Broadcast(login);
            }
        }

        protected override void OnError(ErrorEventArgs e)
        {
        }
    }
}
