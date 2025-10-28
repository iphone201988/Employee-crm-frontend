export interface addCategoryRequest {
    type: string;
    name?: string;
    amount?: number;
}
export interface DeleteCategoryRequest {
    type: string;
    id: string;
}