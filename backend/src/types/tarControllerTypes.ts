export interface CreateTarRequestBody {
    dockerfile: string;
    packageJson: string;
    apiCode: string;  
    userId?: string;   
    description: string;
}