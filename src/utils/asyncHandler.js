import { NextResponse } from "next/server";

export const asyncHandler = (fn) =>{
    return async(request, context) => {
        try {
            return await fn(request, context);
        } catch (error) {
            console.error("🚨 API Route Error:", error);
            const statusCode = error.statusCode || 500;
            const message = error.message || "Internal Server Error";
            const errors = error.errors || [];

            return NextResponse.json(
                {
                success: false,
                message,
                errors,
                },
                { status: statusCode }
            );
        }
    }

}