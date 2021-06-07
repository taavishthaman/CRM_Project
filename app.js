const express = require("express");
const request = require('request');
const cors = require('cors')
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
const mongoose = require("mongoose");

const app = express();

const PORT = process.env.PORT || 5000;

const connectUrl = "https://app.hubspot.com/oauth/authorize?client_id=60c30512-9313-4477-ab1e-3295f7eb29ac&grant_type=refresh_token&scope=contacts%20oauth&redirect_uri=http://localhost:3000/sync";

const contactUrl = "https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=43fe00fa-ade5-424b-a3f1-1570c7659ec2"

mongoose.connect("mongodb://localhost:27017/contactDB", {useNewUrlParser: true});

const contactSchema = new mongoose.Schema({
  firstName : String,
  lastName : String,
  company : String,
  lastModifiedDate : String
})

const countSchema = new mongoose.Schema({
  count : Number
})

const Contact = mongoose.model("Contact", contactSchema);
const Count = mongoose.model("Count", countSchema);

app.get("/api", (req, res) => {
  res.json({message : "Hello from server!"});
});

app.get("/connect", (req, res) => {
  res.redirect(connectUrl);
});

app.get("/contacts", (req, res) => {
  Contact.find({}, function(err, contacts) {
    res.json(contacts);
  })
});

app.get("/bulkSync", (req, res) => {
  //Match the contents of the db table exactly to the source table
  var modifiedContactUrl = contactUrl + "&count=30";
  //&count=10
  request(modifiedContactUrl, (err, resp, body) => {
    Contact.deleteMany({}, function(err){
      if(err){
        console.log(err)
      }
    });
    const parsedBody = JSON.parse(body);
    const contactList = parsedBody.contacts;
    for(var i=0; i<contactList.length; i++){
      var fName = contactList[i].properties.firstname.value;
      var lName = contactList[i].properties.lastname.value;
      var lModifiedDate = contactList[i].properties.lastmodifieddate.value;
      var company = contactList[i].properties.company.value;

      const contact = new Contact({
        firstName : fName,
        lastName : lName,
        company : company,
        lastModifiedDate : lModifiedDate
      })
      contact.save();
    }

    const count = new Count({
      count : contactList.length
    })
    count.save();
    res.redirect("http://localhost:3000/sync")
  })
})

app.get("/incrementalSync", (req, res) => {
  //We'll see when we get here

  /*var modifiedContactUrl = "";
  Count.find({}, function (err, data){
    if(!err){
      var count = 0;
      if(data[0] === undefined){
        count = 1;
      }
      else{
        count = data[0].count + 1;
      }
      console.log(count);
      modifiedContactUrl = contactUrl + "&count=" + (count).toString();
      console.log(modifiedContactUrl);

      request(modifiedContactUrl, (err, resp, body) => {
        Contact.deleteMany({}, function(err){
          if(err){
            console.log(err)
          }
        });
        const parsedBody = JSON.parse(body)
        const contactList = parsedBody.contacts;
        for(var i=0; i<contactList.length; i++){
          var fName = contactList[i].properties.firstname.value;
          var lName = contactList[i].properties.lastname.value;
          var lModifiedDate = contactList[i].properties.lastmodifieddate.value;
          var company = contactList[i].properties.company.value;
    
          const contact = new Contact({
            firstName : fName,
            lastName : lName,
            company : company,
            lastModifiedDate : lModifiedDate
          });
          contact.save();
        }
    
        var newCount = contactList.length+1;
        if(data[0] === undefined){
          const count  = new Count({
            count : 1
          })
          count.save();
        }
        else{
          var newC = data[0].count+1;
          Count.findOneAndUpdate({count : data[0].count}, {count : newC}, {upsert: true}, function(error, doc){
            if(error){
              console.log(error)
            }
          });
        }
        res.redirect("http://localhost:3000/sync");
      })
    }
  })*/

})

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
