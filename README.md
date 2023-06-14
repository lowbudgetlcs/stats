# <center>LBLCS Stats Scripts</center>
## **Overview**
The purpose of this project is to give a way to provide automated stats for League of Legends custom games created with a tournament code. It operates off a callback that Riot sends after the game finishes.
## **Main Script**
This is the main script that receives a callback from Riot and takes the information and sends it to Google Apps Script to format it properly in a Google Sheet
## **Utilities**
### **Create Tournament Script**
This is what will generate tournament codes, run manually
### **Register Provider script**
This registers the callback url that riot will use.