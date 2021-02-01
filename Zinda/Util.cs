using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace Zinda
{
    class Util
    {
        public static string GenerateToken(int length)
        {
            using (RNGCryptoServiceProvider cryptRNG = new RNGCryptoServiceProvider())
            {
                byte[] tokenBuffer = new byte[length];
                cryptRNG.GetBytes(tokenBuffer);
                return Convert.ToBase64String(tokenBuffer);
            }
        }

        public static int ByteToInt(byte[] array, int p)
        {
            int v = (array[p] & 0xff) << 0;
            return v;
        }

        public static byte[] IntToByte(int value)
        {
            byte[] d = new byte[1];
            d[0] = (byte)((value >> 0) & 0xff);
            return d;
        }

        public static int ByteArrayToInt(byte[] array, int p)
        {
            int v = 0;
            v += (array[p + 0] & 0xff) << 24;
            v += (array[p + 1] & 0xff) << 16;
            v += (array[p + 2] & 0xff) << 8;
            v += (array[p + 3] & 0xff) << 0;
            return v;
        }

        public static byte[] IntToByteArray(int value)
        {
            byte[] d = new byte[4];
            d[0] = (byte)((value >> 24) & 0xff);
            d[1] = (byte)((value >> 16) & 0xff);
            d[2] = (byte)((value >> 8) & 0xff);
            d[3] = (byte)((value >> 0) & 0xff);
            return d;
        }

        public static void IntToByteArray(int value, byte[] d, int p)
        {
            d[p + 0] = (byte)((value >> 24) & 0xff);
            d[p + 1] = (byte)((value >> 16) & 0xff);
            d[p + 2] = (byte)((value >> 8) & 0xff);
            d[p + 3] = (byte)((value >> 0) & 0xff);
        }

        public static byte[] ConcatByteArrays(params byte[][] arrays)
        {
            int size = 0;
            for (int i = 0; i < arrays.Length; i++)
            {
                size += arrays[i].Length;
            }
            byte[] d = new byte[size];
            int p = 0;
            for (int i = 0; i < arrays.Length; i++)
            {
                int len = arrays[i].Length;
                Array.Copy(arrays[i], 0, d, p, len);
                p += len;
            }
            return d;
        }
    }
}
