const jwt = require('jsonwebtoken');


exports.checkUser = (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    
    if(token){
        try {
            const decoded = jwt.verify(token, process.env.USER_JWT_SECRET);
        
            req.userId = decoded._id;
            
            next();
        } catch (err) {
            return res.status(403).json({
                message: 'You dont have access 2'
            })
        }
    }else {
        return res.status(403).json({
            message: 'You dont have access'
        })
    }
}