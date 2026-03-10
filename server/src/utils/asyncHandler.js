//below is the utility to wrap a function in promises

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//below is just a wrapper function
//meaning wherever in the code part we want to use async await the we will use
//the below utility by just passinng the function and the below part will wrap the function with async await
//this maintains consistency across the project
//wkt const asyncHandler = () => {}
// now if we want to pass a function
// const asyncHandler = (fn) => { ()=> {} }
// the inner arrow funcitons are related to the function in the  parameter
// so we are just removing the outer brackets and making the inner function async
// even if we keep the outer brackets thats not an issue

/*
const asyncHandler = (fn) => async(req,res,next) => {
    try{
     await fn(req, res, next)
    }
    catch(error){
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
    }
}


*/