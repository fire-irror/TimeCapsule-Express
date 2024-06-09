const express = require('express')
const { Letter,Music } = require('../models')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const mailer = require('./mailSender')
const cron = require('node-cron')
const router = express.Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/capsules'
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath)
        }
        cb(null, uploadPath)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    },
})
const upload = multer({ storage })

//캡슐 이미지 업로드
router.post('/capsule', upload.single('capsuleImage'), async (req, res) => {
    try {
        const { filename, path: filePath } = req.file
        const letter = await Letter.create({
            capsule: path.relative(path.join(__dirname, '..'), filePath) 
        });

        res.status(200).json({
            success: true,
            message: 'CapsuleImage uploaded successfully',
            capsule: letter.capsuleImage 
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Error uploading capsuleImage'
        })
    }
})

//편지 작성
router.patch('/:id', async (req, res) => {
    try {
        const letterId=req.params.id
        const { recipient, email, content} = req.body

        const letter = await Letter.findByPk(letterId);
        if (!letter) {
            return res.status(404).json({ error: 'Letter not found'})
        }

        const newLetter = await Letter.update(
            {recipient, email,content },
            {where:{id:letterId}
        })
        return res.status(200).json();
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Error create letter' })
    }
})

// 편지의 노래 업데이트
router.patch('/:id/music',async(req,res)=>{
    try{
        const letterId=req.params.id
        const {music_id}=req.body

        const letter = await Letter.findByPk(letterId);
        if (!letter) {
            return res.status(404).json({ error: 'Letter not found'})
        }

        const music = await Music.findByPk(music_id)
        if (!music) {
            return res.status(404).json({ error: 'Music not found'})
        }

        const updateLetter=await Letter.update(
            {music_id},
            {where:{id:letterId}}
        )
        return res.status(200).json()
    }catch(error){
        console.log(error)
        return res.status(500).json({error: 'Error update letter with music'})
    }
})

// 자동 이메일 발송
const sendEmails = async () => {
    try {
        const users = await Letter.findAll({ where: { emailSent: 0 } });
        for (const user of users) {
            const url = `https://dinmoy8761.tistory.com/${user.id}`
            const emailParam = {
                toEmail: user.email,
                subject: 'TimeCapsule',
                html: `<h3>TimeCapsule</h3><p>아래 링크를 눌러 작년에 쓴 나의 편지를 확인해보세요</p><a href="${url}">📨 나의 편지 확인하러 가기</a>`+
                '<img src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2Fbk6uhT%2FbtsHQSGPq1T%2Fk5JoB3bMkodPiITDtVlhFk%2Fimg.png"/>',    
            }
            
            //이메일 주소 유효성 검사 / 이메일 주소가 없으면 스킵
            if (!emailParam.toEmail) {
                console.log('No email recipient defined for user:', user.id)
                continue
            }

            try {
                await mailer.sendEmail(emailParam)
                user.emailSent = 1
                await user.save()
                console.log('Success send Email:', user.email)
            } catch (error) {
                console.log('Error send Email:', user.email, ':', error)
            }
        }
    } catch (error) {
        console.log('Error send Emails:', error)
    }
}

cron.schedule('1 * * * * *', sendEmails);


//모든 편지 조회
router.get('/', async (req, res) => {
    try {
        const letters = await Letter.findAll()
        return res.status(200).json(letters)
    } catch (error) {
        return res.status(500).json({ error: 'Error reading all letters' })
    }
})

//캡슐 전체 조회
router.get('/capsule', async (req, res) => {
    try {
        const capsules = await Letter.findAll({
            attributes: ['capsule']
        })
        return res.status(200).json(capsules)
    } catch (error) {
        return res.status(500).json({ error: 'Error reading all capsuleImages' })
    }
})

//편지Id로 특정 편지 조회
router.get('/:id', async (req, res) => {
    try {
        const letterId = req.params.id
        const letter = await Letter.findByPk(letterId)
        if (letter) {
            return res.status(200).json(letter)
        } else {
            return res.status(404).json({ error: 'Letter Not Found' })
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error reading letter' })
    }
})

module.exports = router