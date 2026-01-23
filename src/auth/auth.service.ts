import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const byPhone = await this.prismaService.user.findUnique({
      where: {
        phone: signUpDto.phone,
      },
    });

    if (byPhone)
      throw new ConflictException('User with this phone already exists');

    const byEmail = await this.prismaService.user.findUnique({
      where: {
        email: signUpDto.email,
      },
    });

    if (byEmail)
      throw new ConflictException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const user = await this.prismaService.user.create({
      data: {
        ...signUpDto,
        password: hashedPassword,
      },
    });

    const { password, ...safeUser } = user;

    return safeUser;
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: signInDto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid email or password');

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return accessToken;
  }
}
