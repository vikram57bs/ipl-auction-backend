export interface TokenPayload {
    userId: number;
    username: string;
    role: string;
    teamId?: number;
}
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateToken: (payload: TokenPayload) => string;
export declare const verifyToken: (token: string) => TokenPayload;
//# sourceMappingURL=auth.d.ts.map