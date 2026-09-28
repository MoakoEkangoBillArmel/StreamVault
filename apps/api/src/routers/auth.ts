import { router, publicProcedure } from '../trpc/trpc';
import { UserLoginInput, UserRegisterInput } from '@streaming/shared';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const loginAttempts = new Map<string, { count: number, resetTime: number }>();

export const authRouter = router({
  login: publicProcedure
    .input(UserLoginInput)
    .mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const attempt = loginAttempts.get(input.email) || { count: 0, resetTime: now + 15 * 60 * 1000 };
      
      if (now > attempt.resetTime) {
        attempt.count = 0;
        attempt.resetTime = now + 15 * 60 * 1000;
      }

      if (attempt.count >= 5) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many login attempts. Please try again later.',
        });
      }

      loginAttempts.set(input.email, { count: attempt.count + 1, resetTime: attempt.resetTime });

      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email or password',
        });
      }

      const isValidPassword = await bcrypt.compare(input.password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email or password',
        });
      }

      if (!process.env.JWT_SECRET) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Server configuration error',
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  register: publicProcedure
    .input(UserRegisterInput)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
      });

      if (!process.env.JWT_SECRET) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Server configuration error',
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),
});
