const express=require('express')
const {Letter}=require('../models')

const router=express.Router()

//편지 생성
router.post('/',async(req,res)=>{
    try{
        const {recipient,email,content,capsule,music_id}=req.body
        const newLetter=await Letter.create({
            recipient,
            email,
            content,
            capsule,
            music_id,
        })
        return res.status(200).json(newLetter);
    }catch(error){
        console.log(error)
        return res.status(500).json({error : 'Error create letter'})
    }
})

//모든 편지 조회
router.get('/',async(req,res)=>{
    try{
        const letters=await Letter.findAll()
        return res.status(200).json(letters)
    }catch(error){
        return res.status(500).json({error : 'Error reading all letters'})
    }
})
module.exports=router