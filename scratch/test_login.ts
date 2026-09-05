import { loginService } from "../backend/src/modules/auth/auth.service.js";
import { prisma } from "../backend/src/core/config/prisma.js";

async function test() {
  try {
    console.log("Testing login for dchandrap973@gmail.com...");
    const res = await loginService("dchandrap973@gmail.com", "password");
    console.log("Login success! Result:", res);
  } catch (err: any) {
    console.error("Login error:", err.message, err.statusCode);
  } finally {
    await prisma.$disconnect();
  }
}

test();
