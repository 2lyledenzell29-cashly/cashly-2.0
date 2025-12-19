import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { ApiResponse, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest } from '../types';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    // GET /api/admin/users - Get all users
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();

            res.status(200).json({
                success: true,
                data: users
            } as ApiResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    // GET /api/admin/users/:id - Get user by ID
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(id);

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'User not found'
                    }
                } as ApiResponse);
                return;
            }

            res.status(200).json({
                success: true,
                data: user
            } as ApiResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    // POST /api/admin/users - Create new user
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const userData: CreateUserRequest = req.body;

            // Validate required fields
            if (!userData.username || !userData.email || !userData.password) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: 'Username, email, and password are required'
                    }
                } as ApiResponse);
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_INVALID_EMAIL',
                        message: 'Invalid email format'
                    }
                } as ApiResponse);
                return;
            }

            // Validate password strength
            if (userData.password.length < 8) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_PASSWORD_WEAK',
                        message: 'Password must be at least 8 characters long'
                    }
                } as ApiResponse);
                return;
            }

            const user = await this.userService.createUser(userData);

            res.status(201).json({
                success: true,
                data: user
            } as ApiResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    // PUT /api/admin/users/:id - Update user
    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userData: UpdateUserRequest = req.body;

            // Validate email format if provided
            if (userData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(userData.email)) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'VALIDATION_INVALID_EMAIL',
                            message: 'Invalid email format'
                        }
                    } as ApiResponse);
                    return;
                }
            }

            // Validate wallet limit if provided
            if (userData.wallet_limit !== undefined && userData.wallet_limit < 1) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_INVALID_WALLET_LIMIT',
                        message: 'Wallet limit must be at least 1'
                    }
                } as ApiResponse);
                return;
            }

            const user = await this.userService.updateUser(id, userData);

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'User not found'
                    }
                } as ApiResponse);
                return;
            }

            res.status(200).json({
                success: true,
                data: user
            } as ApiResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    // PUT /api/admin/users/:id/password - Reset user password
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { password }: ResetPasswordRequest = req.body;

            if (!password) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: 'Password is required'
                    }
                } as ApiResponse);
                return;
            }

            // Validate password strength
            if (password.length < 8) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_PASSWORD_WEAK',
                        message: 'Password must be at least 8 characters long'
                    }
                } as ApiResponse);
                return;
            }

            const user = await this.userService.resetUserPassword(id, password);

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'User not found'
                    }
                } as ApiResponse);
                return;
            }

            res.status(200).json({
                success: true,
                data: user
            } as ApiResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    // PUT /api/admin/users/:id/wallet-limit - Update user wallet limit
    async updateWalletLimit(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { walletLimit } = req.body;

            if (walletLimit === undefined || walletLimit === null) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: 'Wallet limit is required'
                    }
                } as ApiResponse);
                return;
            }

            if (typeof walletLimit !== 'number' || walletLimit < 1) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_INVALID_WALLET_LIMIT',
                        message: 'Wallet limit must be a positive number'
                    }
                } as ApiResponse);
                return;
            }

            const user = await this.userService.updateWalletLimit(id, walletLimit);

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'User not found'
                    }
                } as ApiResponse);
                return;
            }

            res.status(200).json({
                success: true,
                data: user
            } as ApiResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    // DELETE /api/admin/users/:id - Delete user
    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.userId;

            // Prevent admin from deleting themselves
            if (id === currentUserId) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_CANNOT_DELETE_SELF',
                        message: 'Cannot delete your own account'
                    }
                } as ApiResponse);
                return;
            }

            const success = await this.userService.deleteUser(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'User not found'
                    }
                } as ApiResponse);
                return;
            }

            res.status(200).json({
                success: true,
                data: { message: 'User deleted successfully' }
            } as ApiResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    private handleError(error: any, res: Response): void {
        const errorMessage = error.message || 'INTERNAL_SERVER_ERROR';

        switch (errorMessage) {
            case 'VALIDATION_EMAIL_EXISTS':
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_EMAIL_EXISTS',
                        message: 'Email already exists'
                    }
                } as ApiResponse);
                break;

            case 'VALIDATION_USERNAME_EXISTS':
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_USERNAME_EXISTS',
                        message: 'Username already exists'
                    }
                } as ApiResponse);
                break;

            case 'RESOURCE_NOT_FOUND':
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'User not found'
                    }
                } as ApiResponse);
                break;

            case 'VALIDATION_INVALID_WALLET_LIMIT':
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_INVALID_WALLET_LIMIT',
                        message: 'Wallet limit must be a positive number'
                    }
                } as ApiResponse);
                break;

            case 'VALIDATION_CANNOT_DELETE_ADMIN':
                res.status(422).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_CANNOT_DELETE_ADMIN',
                        message: 'Cannot delete admin users'
                    }
                } as ApiResponse);
                break;

            case 'AUTH_CANNOT_DELETE_SELF':
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_CANNOT_DELETE_SELF',
                        message: 'Cannot delete your own account'
                    }
                } as ApiResponse);
                break;

            default:
                console.error('User controller error:', error);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An unexpected error occurred'
                    }
                } as ApiResponse);
                break;
        }
    }
}