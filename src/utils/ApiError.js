
class ApiError extends Error {
    constructor(
        statusCode,                                    
        message = "Something went wrong",             
        errors = [],                                  
        stack = ""                                    
    ){
        //PARENT CLASS INITIALIZATION 
        super(message)
        
        // ERROR PROPERTIES 
        this.statusCode = statusCode    
        this.data = null               
        this.message = message         
        this.success = false;           
        this.errors = errors           

        if (stack) {
            // Agar custom stack trace diya hai to use karo
            this.stack = stack
        } else {
            // Nahi to automatic stack trace capture karo
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


export {ApiError}