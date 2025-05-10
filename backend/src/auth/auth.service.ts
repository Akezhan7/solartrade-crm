import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Пользователь с таким email не найден');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Пользователь деактивирован');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: Partial<User>) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    // Create both access and refresh tokens
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, tokenType: 'refresh' },
      { expiresIn: '7d' }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(refreshToken);
      
      // Ensure it's a refresh token
      if (decoded.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get the user from the database
      const user = await this.usersService.findOne(decoded.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      const payload = { email: user.email, sub: user.id, role: user.role };
      const newAccessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, tokenType: 'refresh' },
        { expiresIn: '7d' }
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.usersService.findOne(decoded.sub);
      return { valid: true, user };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}