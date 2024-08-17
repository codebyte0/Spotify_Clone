let currfolder;
let currentAudio = null;

// Function to convert seconds to minutes and seconds
function convertSecondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad with leading zeros
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

// Get songs
async function getSongs(folder) {
    currfolder = folder
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`)
    let response = await a.text()
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        function capitalizeFirstLetter(str) {
            return str.replace(/\b\w/g, function (match) {
                return match.toUpperCase();
            });
        }
        if (element.href.endsWith(".mp3")) {
            let b = songs.push(capitalizeFirstLetter(element.href.split(`/${folder}/`)[1].split(".")[0]));
        }
    }
    return songs;
}

// Play music function
const PlayMusic = (track, pause = false) => {
    if (currentAudio) {
        if (!pause) {
            currentAudio.pause();
            document.querySelector(".play").querySelector("img").src = "images/play.svg";
        } else {
            return; // Do nothing if trying to pause an already paused audio
        }
    }
    let audio = new Audio(`/${currfolder}/${track}.mp3`);
    currentAudio = audio;
    audio.addEventListener('ended', () => {
        document.querySelector(".play").querySelector("img").src = "images/play.svg";
        currentAudio = null;
    });
    if (!pause) {
        currentAudio.play();
        document.querySelector(".play").querySelector("img").src = "images/pause.svg";
    } else {
        document.querySelector(".play").querySelector("img").src = "images/play.svg";
    }
    console.log(`Now playing: ${track}`);
    document.querySelector(".info-part1").innerHTML = decodeURI(track);
    document.querySelector(".stuff-part3").innerHTML = `00:00 / 00:00`;
};

// Display Albums 
async function displayAlbums(Songslist) {
    let a = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cards-container");

    for (const e of anchors) {
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2, -1)[0];

            // get the metadata of folders
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let responseText = await a.text();

            try {
                let response = JSON.parse(responseText);
                cardContainer.innerHTML += `<div class="p-card p-card5 flex a-center jus-center cur-pointer" data-folder="${folder}">
                    <div class="card-img"><img src="songs/${folder}/cover.jpeg"></div>
                    <div class="card-content">
                        <h3>${response.title}</h3>
                        <p>${response.desc}</p>
                    </div>
                    <div class="play-button"><img src="images/playbutton.svg"></div>
                </div>`;
            } catch (error) {
                console.error("Invalid JSON response:", responseText);
            }
        }
    }

    // Load the playlist whenever card is clicked 
    Array.from(document.getElementsByClassName("p-card")).forEach(e => {
        e.addEventListener("click", async () => {
            let songs = await getSongs(`songs/${e.dataset.folder}`);
            PlayMusic(songs[0])

            Songslist.innerHTML = "";

            // Add new songs to the list
            for (const song of songs) {
                Songslist.innerHTML += `<div class="song-card flex jus-center a-center cur-pointer">
                    <div class="music-logo invert"><img src="images/music.svg"></div>
                    <div class="song-info"><div class="song-name">${song}</div></div>
                    <div class="play-now-txt">Play now</div>
                    <div class="play-now-img"><img class="invert" src="images/play-now.svg"></div>
                </div>`;
            }

            // Add event listeners for the new songs
            Array.from(document.querySelector(".songs-list").getElementsByClassName("song-card")).forEach(cardElement => {
                cardElement.addEventListener("click", event => {
                    const songName = event.currentTarget.querySelector(".song-info").firstElementChild.innerHTML.trim();
                    PlayMusic(songName);
                });
            });
        });
    });
}

// Main function
async function main() {
    let currentsong;
    let songs = await getSongs(`songs/Royalty-Free-music`);
    PlayMusic(songs[0], true);
    let Songslist = document.querySelector(".songs-list");
    currentsong = songs[0];
    PlayMusic(currentsong, true);
    await displayAlbums(Songslist);

    for (const song of songs) {
        Songslist.innerHTML += `<div class="song-card flex jus-center a-center cur-pointer">
            <div class="music-logo invert"><img src="images/music.svg"></div>
            <div class="song-info"><div class="song-name">${song}</div></div>
            <div class="play-now-txt">Play now</div>
            <div class="play-now-img"><img class="invert" src="images/play-now.svg"></div>
        </div>`;
    }

    Array.from(document.querySelector(".songs-list").getElementsByClassName("song-card")).forEach(cardElement => {
        cardElement.addEventListener("click", event => {
            const songName = event.currentTarget.querySelector(".song-info").firstElementChild.innerHTML.trim();
            PlayMusic(songName);
        });
    });

    let playButtons = document.querySelectorAll(".play");

    playButtons.forEach(playButton => {
        playButton.addEventListener("click", () => {
            if (currentAudio) {
                if (currentAudio.paused) {
                    currentAudio.play();
                    playButton.querySelector("img").src = "images/pause.svg";
                } else {
                    currentAudio.pause();
                    playButton.querySelector("img").src = "images/play.svg";
                }
            }
        });
    });

    // Listen for time update
    setInterval(() => {
        currentAudio.addEventListener("timeupdate", () => {
            document.querySelector(".stuff-part3").innerHTML = `${convertSecondsToMinutesSeconds(currentAudio.currentTime)}/${convertSecondsToMinutesSeconds(currentAudio.duration)}`
            document.querySelector(".circle").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%"
        });
    }, 1000);

    // Add an event listener to the seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%"
        currentAudio.currentTime = ((currentAudio.duration) * percent) / 100
    });

    let prev = document.querySelector(".play-back");
    let next = document.querySelector(".play-next");
    let currentFolder;

    Array.from(document.getElementsByClassName("p-card")).forEach(e => {
        e.addEventListener("click", async () => {
            currentFolder = e.dataset.folder;
            let songs = await getSongs(`songs/${currentFolder}`);
            currentsong = songs[0];
            PlayMusic(currentsong);
        });
    });

    prev.addEventListener("click", () => {
        if (currentAudio && currentFolder) {
            getSongs(`songs/${currentFolder}`).then(songs => {
                const currentIndex = songs.indexOf(currentsong);
                const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
                currentsong = songs[prevIndex];
                PlayMusic(currentsong);
            });
        }
    });

    next.addEventListener("click", () => {
        if (currentAudio && currentFolder) {
            getSongs(`songs/${currentFolder}`).then(songs => {
                const currentIndex = songs.indexOf(currentsong);
                const nextIndex = (currentIndex + 1) % songs.length;
                currentsong = songs[nextIndex];
                PlayMusic(currentsong);
            });
        }
    });


    // Volume setup
    // Add an event listener to the volume bar
    document.getElementById("volumeBar").addEventListener("input", (event) => {
        const volume = event.target.value / 100; // Convert the range input value to a percentage
        setVolume(volume);
    });

    // Function to adjust the volume
    function adjustVolume(change) {
        if (currentAudio) {
            const newVolume = Math.max(0, Math.min(1, currentAudio.volume + change));
            currentAudio.volume = newVolume;
            updateVolumeBar(newVolume);
        }
    }

    // Function to set the volume
    function setVolume(volume) {
        if (currentAudio) {
            currentAudio.volume = volume;
            updateVolumeBar(volume);
        }
    }

    // Function to update the visual representation of the volume bar
    function updateVolumeBar(volume) {
        const volumeBar = document.getElementById("volumeBar");
        volumeBar.value = volume * 100; // Adjust the value for a percentage display
    }

    // Add an event listener to the volume icon to toggle mute/unmute
    const volumeIcon = document.querySelector(".material-symbols-outlined");

    document.querySelector(".material-symbols-outlined").addEventListener("click", () => {
        toggleMute();
    });

    // Function to toggle mute/unmute
    function toggleMute() {
        if (currentAudio) {
            if (currentAudio.muted) {
                currentAudio.muted = false;
                currentAudio.volume = previousVolume;
                updateVolumeBar(currentAudio.volume);
                volumeIcon.textContent = "volume_up";
            } else {
                // Mute
                previousVolume = currentAudio.volume;
                currentAudio.muted = true;
                updateVolumeBar(0);
                volumeIcon.innerHTML = `<img class="invert" src="images/mute.svg">`;
            }
        }
    }
}

let previousVolume = 1.0;
main();
