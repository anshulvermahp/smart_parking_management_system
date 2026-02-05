const users  = require("../models/register")
const imagekit = require("../config/imagekit")



async function newUser(req, res) {


    let data = req.body;
  if (!data) {
    return res.status(400).send("Invalid Input")
  }

  // Basic validation
  const errors = [];
  const username = (data.username || '').toString().trim();
  const email = (data.email || '').toString().trim();
  const password = (data.password || '').toString();
  const phoneNumber = (data.phoneNumber || '').toString().trim();

  if (!username || username.length < 3) errors.push('Username must be at least 3 characters');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) errors.push('Invalid email');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  const phoneDigits = phoneNumber.replace(/\D/g, '');
  if (phoneNumber && phoneDigits.length < 7) errors.push('Phone number seems invalid');

  if (errors.length) {
    return res.status(400).send({ errors });
  }

  // sanitize back into data
  data.username = username;
  data.email = email;
  data.password = password;
  data.phoneNumber = phoneNumber;

  // proceed
  try {
    try {
      // If a file was uploaded, upload it to ImageKit and get the URL
      let profileUrl = "";
      if (req.file) {
        try {
          const file64 = req.file.buffer.toString('base64');
          const uploadResult = await new Promise((resolve, reject) => {
            imagekit.upload({
              file: `data:${req.file.mimetype};base64,${file64}`,
              fileName: req.file.originalname
            }, (err, result) => {
              if (err) return reject(err);
              resolve(result);
            })
          })
          profileUrl = uploadResult.url || '';
        } catch (err) {
          console.error('Image upload failed:', err);
          // If upload failed due to file size or type, return clear error
          if (err.message && err.message.includes('File too large')) {
            return res.status(400).send('Profile image too large (max 2MB)');
          }
        }
      }

      let newUser = await users.create({
        username: data.username,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        profilePicture: profileUrl
      })

      // Render the registration success page (modern themed)
      return res.status(201).render('register-success', { user: newUser })
    } catch (err) {
      // Handle Mongo duplicate key error
      if (err && err.code === 11000) {
        const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field'
        return res.status(409).send(`${field} already exists`)
      }

      // Generic server error
      console.error('Registration error:', err)
      return res.status(500).send('Server error during registration')
    }
  }
 
  

  catch (error) {
    console.error("Unexpected error during registration:", error)
    return res.status(500).send("Unexpected server error")
  }

    
    
}

async function registerUserPage(req,res) {

    res.render("register")
    
}

module.exports =
{
     newUser,
     registerUserPage
}