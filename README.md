Node app for collecting images / inspiration / mood boards.

Brought to you by Marcin Ignac http://marcinignac.com

### Setup

Download the repo

    git clone git@github.com:vorg/kollektor.git

Install dependencies

    cd kollector
    npm install

Start the app

    node app.js

### Uploading images

Visit your (empty) image collection by opening

    http://localhost:3000/


Drag some image files from your desktop to the browser window (a yellow overlay should appear od drag over).

### Editing images

To edit image metadata mouse over the thumbnail and press and hold the url / title / tags. After editing press ENTER to your changes.

Delete/Refresh links are part of the tag list so you have to click one of them if there is no other tags. Refresh doesn't do anything yet.

### Scraping images from other websites

To add images from other websites to to bookmarklet url copy the code and add new bookmark to you bookmark bar

    http://localhost:3000/bookmarklet

Visit any website and launch the bookmarket. You should get list of thumbnails and 2 input fields first is title seconds is space separated list of tags. Click any thumbnail, update title and tags and press 'add' button. Press 'ESC' to close thumbnail list.


# Extra

To see all your tags with recent images (aka pinterest boards) go to

    http://localhost:3000/tags/

