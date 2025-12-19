import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/UserRepository';
import { User, CreateUserRequest, UpdateUserRequest, UserResponse } from '../types';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.userRepository.findAll();
    return users.map(this.toUserResponse);
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.toUserResponse(user) : null;
  }

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    // Check if user already exists
    const existingUserByEmail = await this.userRepository.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error('VALIDATION_EMAIL_EXISTS');
    }

    const existingUserByUsername = await this.userRepository.findByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error('VALIDATION_USERNAME_EXISTS');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Create user object
    const newUser: User = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role || 'user',
      wallet_limit: userData.wallet_limit || 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    const createdUser = await this.userRepository.create(newUser);
    return this.toUserResponse(createdUser);
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<UserResponse | null> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Check for email conflicts if email is being updated
    if (userData.email && userData.email !== existingUser.email) {
      const emailConflict = await this.userRepository.findByEmail(userData.email);
      if (emailConflict) {
        throw new Error('VALIDATION_EMAIL_EXISTS');
      }
    }

    // Check for username conflicts if username is being updated
    if (userData.username && userData.username !== existingUser.username) {
      const usernameConflict = await this.userRepository.findByUsername(userData.username);
      if (usernameConflict) {
        throw new Error('VALIDATION_USERNAME_EXISTS');
      }
    }

    const updateData = {
      ...userData,
      updated_at: new Date()
    };

    const updatedUser = await this.userRepository.update(id, updateData);
    return updatedUser ? this.toUserResponse(updatedUser) : null;
  }

  async resetUserPassword(id: string, newPassword: string): Promise<UserResponse | null> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const updatedUser = await this.userRepository.update(id, {
      password_hash: passwordHash,
      updated_at: new Date()
    });

    return updatedUser ? this.toUserResponse(updatedUser) : null;
  }

  async updateWalletLimit(id: string, walletLimit: number): Promise<UserResponse | null> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (walletLimit < 1) {
      throw new Error('VALIDATION_INVALID_WALLET_LIMIT');
    }

    const updatedUser = await this.userRepository.updateWalletLimit(id, walletLimit);
    return updatedUser ? this.toUserResponse(updatedUser) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Prevent deletion of admin users (business rule)
    if (existingUser.role === 'admin') {
      throw new Error('VALIDATION_CANNOT_DELETE_ADMIN');
    }

    return await this.userRepository.delete(id);
  }

  private toUserResponse(user: User): UserResponse {
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
}