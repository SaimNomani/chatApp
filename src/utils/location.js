const generateLocationMessages=function(username, locationUrl){
    return {
        locationUrl,
        createdAt: new Date().getTime(),
        username
    }
}

module.exports={
    generateLocationMessages
}