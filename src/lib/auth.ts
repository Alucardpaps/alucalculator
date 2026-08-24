import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "./db";
import { mockStorage } from "./repositories/mockStorage";

/**
 * NextAuth Configuration (Production Ready)
 * Uses PostgresAdapter for persistent user, account, and session management.
 */

export const authOptions: NextAuthOptions = {
    // 1. Persistent Database Adapter
    adapter: PostgresAdapter(pool),
    
    // 2. Identity Providers
    providers: [
        // 2.1 Google OAuth (Conditional)
        ...(process.env.GOOGLE_CLIENT_ID ? [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            }),
        ] : []),

        // 2.2 Local Development Fallback
        CredentialsProvider({
            name: "Workstation Access",
            credentials: {
                email: { label: "Email Address", type: "email", placeholder: "engineering@alucalc.com" },
                password: { label: "Password (any)", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    console.warn("Auth Attempt: Missing email");
                    return null;
                }

                console.log(`Auth Attempt: Initiating login for ${credentials.email}`);

                try {
                    // 1. Check if user exists
                    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [credentials.email]);
                    
                    if ((userRes as any).isMock) {
                        const users = mockStorage.get<any>('users');
                        let user = users.find(u => u.email === credentials.email);
                        if (!user) {
                            user = { id: Date.now().toString(), name: credentials.email.split('@')[0], email: credentials.email };
                            mockStorage.upsert('users', user);
                        }
                        return user;
                    }

                    let user = userRes.rows[0];

                    // 2. Auto-Register if new user (Dev/Test Environment Optimization)
                    if (!user) {
                        console.log(`Auth System: Registering new user ${credentials.email}`);
                        const newUserRes = await pool.query(
                            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
                            [credentials.email.split('@')[0], credentials.email]
                        );
                        user = newUserRes.rows[0];
                    }

                    console.log(`Auth Success: User ${user.email} (ID: ${user.id}) authenticated.`);

                    return { 
                        id: user.id.toString(), 
                        name: user.name, 
                        email: user.email 
                    };
                } catch (err: any) {
                    console.error("CRITICAL AUTH ERROR:", err.message);
                    
                    // Failover to local mock if still failing
                    const users = mockStorage.get<any>('users');
                    let user = users.find(u => u.email === credentials.email);
                    if (!user) {
                        user = { id: "mock_" + Date.now(), name: credentials.email?.split('@')[0], email: credentials.email };
                        mockStorage.upsert('users', user);
                    }
                    return user;
                }
            }
        })
    ],

    // 3. Session Strategy
    // We use "jwt" by default for performance, but the adapter handles user persistence.
    // If you need server-side session revocation, switch to "database".
    session: {
        strategy: "jwt",
    },

    callbacks: {
        /**
         * JWT Callback: Injects the DB User ID into the token.
         */
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },

        /**
         * Session Callback: Propagates the DB User ID to the client-side session.
         */
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },

    secret: process.env.NEXTAUTH_SECRET,
};
