import { Component, OnInit } from "@angular/core";
import { SpotifyService } from "../../services/spotify.service";
import { ActivatedRoute } from "@angular/router";
import { Artist } from "../../../../Artist";
import { Album } from "../../../../Album";
import { map } from "rxjs/operators";
import { OwlOptions } from "ngx-owl-carousel-o";
import * as $ from "jquery";
import * as _ from "lodash";

@Component({
  selector: "album",
  templateUrl: "album.component.html",
  styleUrls: ["./album.component.css"],
  providers: [SpotifyService]
})
export class AlbumComponent implements OnInit {
  id: string;
  artistID: string;
  artistPhoto: string;
  album: Album[];
  tracks: any;
  trackIDs = new Array();
  allTracksInfo: Object[] = [];
  allTracksAudioFeatures: Object[] = [];
  featureHeadings = [
    "Danceability",
    "Energy",
    "Speechiness",
    "Acousticness",
    "Liveness",
    "Valence"
  ];
  keysToDelete = [
    "key",
    "loudness",
    "mode",
    "instrumentalness",
    "loudness",
    "tempo",
    "id",
    "uri",
    "track_href",
    "analysis_url",
    "duration_ms",
    "time_signature",
    "type"
  ];
  constructor(
    private SpotifyService: SpotifyService,
    private route: ActivatedRoute
  ) {}
  ngOnInit() {
    // Get the album.
    this.route.params.pipe(map(params => params["id"])).subscribe(id => {
      this.SpotifyService.getToken().subscribe(data => {
        this.SpotifyService.getAlbum(id, data["access_token"]).subscribe(
          album => {
            this.album = album;
            // Get the artist ID of this album's artist.
            this.artistID = album["artists"][0]["id"];
            {
              this.SpotifyService.getArtist(
                this.artistID,
                data["access_token"]
              ).subscribe(artist => {
                this.artistPhoto = artist["images"][0]["url"];
              });
            }
          }
        );
      });
    });
    // Get the album's tracks
    this.route.params.pipe(map(params => params["id"])).subscribe(id => {
      this.SpotifyService.getToken().subscribe(data => {
        this.SpotifyService.getAlbumTracks(id, data["access_token"]).subscribe(
          tracks => {
            this.tracks = tracks["items"];
            // push each track id into an array so we can use it to fetch multiple tracks at once
            for (var i in this.tracks) {
              this.trackIDs.push(this.tracks[i]["id"]);
            }
            {
              // Get basic information about the tracks (artist, popularity, etc.)
              this.SpotifyService.getTracks(
                this.getTracksString(this.trackIDs),
                data["access_token"]
              ).subscribe(trackinfo => {
                this.allTracksInfo = trackinfo["tracks"];
                // Get audio features (danceability, energy, etc.)
                this.SpotifyService.getTracksFeatures(
                  this.getTracksString(this.trackIDs),
                  data["access_token"]
                ).subscribe(trackfeatures => {
                  this.allTracksAudioFeatures = trackfeatures["audio_features"];
                  // Delete unwanted properties of the object.
                  for (var audioFeatureObject of this.allTracksAudioFeatures) {
                    for (var keyToDelete of this.keysToDelete) {
                      delete audioFeatureObject[keyToDelete];
                    }
                  }
                });
              });
            }
          }
        );
      });
    });
  }
  // Capitalizes the first letter of a given string
  capitalizeFirstLetter(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  // Takes in an array of trackIDs and appends them to a string to pass to the service method
  getTracksString(trackIDs: any[]) {
    var tracksString = ""; // comma separated list of all the trackIDs
    var numOfTracks = trackIDs.length;
    for (var i = 0; i < numOfTracks; i++) {
      // don't append a comma if it's the last element
      if (i == numOfTracks - 1) tracksString = tracksString + trackIDs[i];
      else tracksString = tracksString + trackIDs[i] + ",";
    }
    return tracksString;
  }
  // Convert the millisecond duration into the traditional mm:ss form.
  msToSongTime(ms: any) {
    var minutes = Math.floor(ms / 60000);
    var seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (Number(seconds) < 10 ? "0" : "") + seconds;
  }
  updateDonutChart(chartID: any, percent: number) {
    percent = Math.round(percent);
    if (percent > 100) {
      percent = 100;
    } else if (percent < 0) {
      percent = 0;
    }
    var deg = Math.round(360 * (percent / 100));
    if (percent > 50) {
      $(chartID + " .pie").css("clip", "rect(auto, auto, auto, auto)");
      $(chartID + " .right-side").css("transform", "rotate(180deg)");
    } else {
      $(chartID + " .pie").css("clip", "rect(0, 1em, 1em, 0.5em)");
      $(chartID + " .right-side").css("transform", "rotate(0deg)");
    }
    $(chartID + " .right-side").css("border-width", "0.1em");
    $(chartID + " .left-side").css("border-width", "0.1em");
    $(chartID + " .shadow").css("border-width", "0.1em");
    $(chartID + " .num").text(percent);
    $(chartID + " .left-side").css("transform", "rotate(" + deg + "deg)");
  }
}