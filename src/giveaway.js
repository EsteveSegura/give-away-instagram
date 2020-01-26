global.noLogo = true;
require('tools-for-instagram');
process.stdout.write('\033c');
require('dotenv').config();
const fs = require('fs');
const colors = require('colors')
const _ = require('lodash')

let argv = require('minimist')(process.argv.slice(2));

/*
    Sorteo Ideal :
        node giveaway --url <URL POST> -o sorte.json --removeDoubles --if --user <INSTAGRAM USER HOST>

    Parameters:
        --url <URL post instagram> : url de la media subida a instagram para sortear
        -o <Archivo .JSON>: output del archivo en formato json
        --file <Archivo .JSON> : Correr un sorteo en base a un archivo JSON (--rr)
        --removeDoubles : Elimina los duplicados
        --if : Comprobar si el ganador sigue a la cuenta
        --user : Cuenta host del sorteo

    ToDo:
        [x]Sorteos vía url
        [x]Elimina los duplicados 
        [x]Output JSON
        [x]Rerun Sorteo basado en json ``--file -f ``
        [x]Comprobar si me sigue.
*/

function checkParams() {
    if (typeof argv.url == "undefined") {
        console.log(colors.red("[X]"), "No URL specified")
    }

    if (typeof argv.file == "undefined") {
        console.log(colors.red("[X]"), "No file specified")
    }

    if (typeof argv.url == "undefined" && typeof argv.file == "undefined") {
        process.exit()
    }
}

function readFileJson(file) {
    return new Promise((resolve, reject) => {
        console.log(file)
        fs.readFile(file, (err, data) => {
            console.log(data)
            if (err) reject(err);
            let ruffleData = JSON.parse(data);
            resolve(ruffleData);
        });
    })
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function removeDuplicated(arr) {
    let filterRepeated = _.uniqBy(arr, "user_id")
    return filterRepeated
}

async function countdown() {
    process.stdout.write('\033c');
    console.log('------ DRAW A WINNER ------');
    await sleep(1, false)
    console.log('------ 5 ------');
    await sleep(1, false)
    console.log('------ 4 ------');
    await sleep(1, false)
    console.log('------ 3 ------');
    await sleep(1, false)
    console.log('------ 2 ------');
    await sleep(1, false)
    console.log('------ 1 ------');
    await sleep(1, false)
}

async function fillDataRuffle(method, input, ig) {
    switch (method) {
        case "url":
            console.log("RUFFLE VIA URL", input)
            let outputURL = await getPostCommentsById(ig, await urlToMediaId(ig, input), Number.POSITIVE_INFINITY);
            return outputURL;

        case "file":
            console.log("RUFFLE VIA FILE", input)
            let outputFILE = await readFileJson(`./${input}`);
            return outputFILE;

        default:
            console.log("FAILED RUFFLE")
            return [];
    }
}

(async () => {
    checkParams();
    let ig = await login();
    process.stdout.write('\033c'); //CLEAR
    console.log(`${colors.cyan(`RAFFLE`)} by: ${colors.green(`@GiRLaZo`)} running on ${colors.cyan(`TFI by: @Linkfy`)}`)
    console.log(colors.green("[O]"), "The data for continue with ruffle is valid");

    if (argv.removeDoubles) {
        console.log(colors.green("[O]"), "Removing duplicateds");
    }

    if (typeof argv.url != "undefined") {
        try {
            let media_id = await urlToMediaId(ig, argv.url);
        } catch (error) {
            console.log(colors.red("[X]"), "URL specified is not valid");
            process.exit();
        }

        console.log(colors.green("[O]"), `${colors.cyan(argv.url)} was converted to media_id => ${colors.cyan(media_id)}`);
        console.log(`------ COMMENTS ------`);
    }

    let comments = await fillDataRuffle(typeof argv.file == "undefined" ? "url" : "file", typeof argv.file == "undefined" ? argv.url : argv.file, ig)


    if (argv.removeDoubles) {
        let commentsLengthAfterRemoveDuplicateds = comments.length;
        comments = removeDuplicated(comments);
        console.log(colors.yellow('Removing duplicateds...'));
        console.log(colors.yellow(`Comments before filtering by doubles: ${commentsLengthAfterRemoveDuplicateds}`));
        console.log(colors.green(`Comments after filtering by doubles: ${comments.length}`));
        await sleep(3, false);
    }

    if (typeof argv.o != "undefined") {
        fs.writeFile(`./${argv.o}`, JSON.stringify(comments), 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }

    let winner = comments[randomIntFromInterval(0, comments.length - 1)];
    console.log(`Usuario escogido previa comprobación de follow ${winner.user.username}`);

    if (typeof argv.if != "undefined" && typeof argv.user != "undefined") {
        let winnerIsFollowingMe = false;
        let counter = 0;
        let followers = await getFollowers(ig, argv.user);
        let readFileFollowers = await readFollowers(ig, argv.user);

        while (!winnerIsFollowingMe) {

            if (counter <= 1) {
                winner = comments[randomIntFromInterval(0, comments.length - 1)];
            }

            counter++;
            for (let i = 0; i < readFileFollowers.length; i++) {
                if (winner.user.username == readFileFollowers[i].username) {
                    winnerIsFollowingMe = true;
                    break;
                }
            }
        }
        await sleep(6);
    }

    await countdown();
    console.log(`Congratulations to the winner: http://instagram.com/${winner.user.username}`);
    process.exit();

})();
