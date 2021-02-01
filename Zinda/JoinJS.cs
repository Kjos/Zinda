using System;
using System.IO;

namespace Zinda
{
    public class JoinJS
    {
        public static void Join()
        {
            string path = "../../www/js";
            if (!Directory.Exists(path )) return;

            string concat = "";
            foreach (string file in Directory.EnumerateFiles(path))
            {
                string content = File.ReadAllText(file);
                concat += content + "\n";
            }
            File.WriteAllText(path + "/script.js", concat);
        }
    }
}
