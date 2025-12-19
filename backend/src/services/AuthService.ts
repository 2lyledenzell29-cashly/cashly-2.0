import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/UserRepository';
import { User, RegisterRequest, LoginRequest, AuthResponse, JWTPayload } from '../types';

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private jwtExpiration: string;
  private saltRounds: number;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '24h';
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const { username, email, password, confirmPassword } = registerData;

    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new Error('VALIDATION_PASSWORD_MISMATCH');
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Check if user already exists
    const existingUserByEmail = await this.userRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('USER_EMAIL_EXISTS');
    }

    const existingUserByUsername = await this.userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new Error('USER_USERNAME_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // Create user
    const newUser: Omit<User, 'created_at' | 'updated_at'> = {
      id: uuidv4(),
      username,
      email,
      password_hash: passwordHash,
      role: 'user',
      wallet_limit: 1 // Default wallet limit
    };

    const createdUser = await this.userRepository.create(newUser);
    if (!createdUser) {
      throw new Error('USER_CREATION_FAILED');
    }

    // Generate JWT token
    const token = this.generateToken(createdUser);

    return {
      user: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        wallet_limit: createdUser.wallet_limit
      },
      token
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { emailOrUsername, password } = loginData;

    // Find user by email or username
    const user = await this.userRepository.findByEmailOrUsername(emailOrUsername);
    if (!user) {
      throw new Error('AUTH_INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('AUTH_INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        wallet_limit: user.wallet_limit
      },
      token
    };
  }

  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('AUTH_TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('AUTH_TOKEN_INVALID');
      }
      throw new Error('AUTH_TOKEN_INVALID');
    }
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    try {
      // Verify the token (even if expired, we can still decode it)
      const decoded = jwt.decode(token) as JWTPayload;
      
      if (!decoded || !decoded.userId) {
        throw new Error('AUTH_TOKEN_INVALID');
      }

      // Get fresh user data
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Generate new token
      const newToken = this.generateToken(user);

      return { token: newToken };
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      throw new Error('AUTH_TOKEN_INVALID');
    }
  }

  async getCurrentUser(userId: string): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      wallet_limit: user.wallet_limit,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  private validatePasswordStrength(password: string): void {
    // Password must be at least 8 characters long
    if (password.length < 8) {
      throw new Error('VALIDATION_PASSWORD_WEAK');
    }

    // Password must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('VALIDATION_PASSWORD_WEAK');
    }

    // Password must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('VALIDATION_PASSWORD_WEAK');
    }

    // Password must contain at least one number
    if (!/\d/.test(password)) {
      throw new Error('VALIDATION_PASSWORD_WEAK');
    }

    // Password must contain at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('VALIDATION_PASSWORD_WEAK');
    }
  }
}