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

Go to bookmarklet url copy the code and add new bookmark to you bookmark bar

    http://localhost:3000/bookmarklet

Visit any website and launch the bookmarket. You should get list of thumbnails and 2 input fields first is title seconds is space separated list of tags. Click any thumbnail, update title and tags and press 'add' button. Press 'ESC' to close thumbnail list.

Visit your image collection by opening

    http://localhost:3000/

To see all your tags with recent images (aka pinterest boards) go to

    http://localhost:3000/tags/