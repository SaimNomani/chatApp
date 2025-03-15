const generateMessages=function(username, text){
    console.log(username)
    return {
        text,
        createdAt: new Date().getTime(),
        username

    }
}

module.exports={
    generateMessages
}