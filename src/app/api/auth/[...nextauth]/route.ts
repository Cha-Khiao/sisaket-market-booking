import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
        }

        await connectToDatabase();
        
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("ไม่พบอีเมลนี้ในระบบ");

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordMatch) throw new Error("รหัสผ่านไม่ถูกต้อง");

        // ส่งข้อมูลเบอร์โทรศัพท์ไปให้ระบบด้วย
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber, // 👈 ส่งเบอร์โทร
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    // เอาเบอร์โทรฝังลงใน Token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phoneNumber = (user as any).phoneNumber; // 👈 ฝังเบอร์โทร
      }
      return token;
    },
    // เอาเบอร์โทรจาก Token มาใส่ใน Session เพื่อให้ Navbar เรียกใช้ได้
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phoneNumber = token.phoneNumber; // 👈 ดึงเบอร์โทรไปใช้
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };