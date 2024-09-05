"use server";

import { generateId } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { lucia } from "@/lib/lucia";
import { prisma } from "@/lib/prisma";
import crypto from "crypto"; // Add this import

const signUp = async (formData: FormData) => {
  const formDataRaw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  if (formDataRaw.password !== formDataRaw.confirmPassword) {
    throw new Error("Passwords do not match");
  }

  try {
    const hashedPassword = await new Argon2id().hash(formDataRaw.password);
    const userId = generateId(15);
    const salt = crypto.randomBytes(16).toString("hex"); // Add this line

    await prisma.user.create({
      data: {
        id: userId,
        firstName: formDataRaw.firstName,
        lastName: formDataRaw.lastName,
        email: formDataRaw.email,
        hashedPassword,
        salt,
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  } catch (error) {
    // TODO: add error feedback yourself
    // https://www.robinwieruch.de/next-forms/
  }

  console.log("Redirecting to /dashboard");
  redirect("/dashboard");
};

export { signUp };
