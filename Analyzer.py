from __future__ import annotations

from MusiStrata.Components import *

import mido
from utils import FindExclusionThreshold, GetSelectedMessageTypes, MessageTimeToAbsolute, Counter, LayeredCounter
from copy import deepcopy

from numpy import array

import json
import argparse

fp = "TestInputs/DQVIII_Reminiscence.mid"
fp2 = "TestInputs/ffxseymourblackmages.mid"


"""
What output?

Features of interest per track:
- Note_on visualiser (time and frequency) aka frequency points before
- DeltaTimes
- Standalone Intervals
- Successive Intervals
- Is Percussions track

- Chords, later?



=> Get track instrument? maybe later I guess


=> color palettes will need to be set in app
=> for Standalone intervals, maybe different for perfect, imperfect consonances and dissonances?
=> or Perfect, Minor, Major, Augmented, Diminished, Doubly Augmented, Doubly Diminished
=> in which case, get a list [interval.ShortStr(), interval.Quality]

[
    {
        Times: [float],
        Frequencies: [float],
        DeltaTimes: [float],
        IntervalsStandalone: [interval.ShortStr()],  // for color, lookup can be defined somewhere else
        IntervalsSuccession: {str: { str: int}}
        IsDrumsTrack: bool
        
    }

]

also want to be able to seperate per track from concatenated

=> organize app like this: (each line is a row of elements)
name, file select, load button
button per channel, button global, button disable drums (deactivated or invisible when per channel?)
control buttons (in a column like before, but with a select track above other buttons), chart


maybe change plotting backend?
use selected color palette. Maybe write to file if not enough colors?

"""


def main(filepath: str = fp):
    # load file
    f = mido.MidiFile(filepath)
    preprocessedTracks = PreprocessTracks(f.tracks)

    # Outliers in term of delta time will need to be excluded
    dts = []
    for track in preprocessedTracks:
        for i in range(1, len(track)):
            dts.append(track[i].time - track[i - 1].time)

    dts = array(dts)
    exclThreshold = FindExclusionThreshold(arr=dts[dts > 0], cutoffMultiplier=5)

    """
    dts.sort()
    dts = [int(elem) for elem in dts]
    deltaTimes = Counter()
    deltaTimes.AddListElements(dts)
    """

    specs = []
    for track in preprocessedTracks:
        isDrumsTrack = IsDrumsTrack(track)
        times, frequencies, deltaTimes, intervalsStandalone, intervalsSuccession = ExtractDataTrack(track, exclThreshold)
        # sort intervals
        currSpecs = {
            "Times": times,
            "Frequencies": frequencies,
            "DeltaTimes": deltaTimes,
            "IntervalsStandalone": intervalsStandalone,
            "IntervalsSuccession": intervalsSuccession,
            "IsDrumsTrack": isDrumsTrack
        }
        specs.append(currSpecs)

        """
        Times: [float],
        Frequencies: [float],
        DeltaTimes: {int: int},
        IntervalsStandalone: {str: int},  // for color, lookup can be defined somewhere else
        IntervalsSuccession: {str: { str: int}}
        IsDrumsTrack: bool
        specs.append(currSpecs)
        """

    return specs


def PreprocessTracks(tracks: List[mido.MidiTrack]) -> List[List[mido.Message]]:
    # switch to absolute time
    absTimeTracks = [MessageTimeToAbsolute(track) for track in tracks]
    # only keep note on events
    filteredTracks = [GetSelectedMessageTypes(track, ["note_on"]) for track in absTimeTracks]
    # keep tracks which do have note on events
    filteredTracks = list(filter(lambda x: len(x) > 0, filteredTracks))
    filteredTracks = [ExcludeChords(track) for track in filteredTracks]
    return filteredTracks



def ExtractDataTrack(track: List[mido.Message], exclusionThreshold: float) -> Tuple(List[Interval], List[int]):
    standaloneIntervals = []
    deltaTimes = []

    times = [track[0].time]
    frequencies = [Note.FromHeight(track[0].note).Frequency]

    for idMsg in range(1, len(track)):
        dt = track[idMsg].time - track[idMsg - 1].time
        if dt < exclusionThreshold:
            deltaTimes.append(dt)

            n0 = Note.FromHeight(track[idMsg].note)
            n1 = Note.FromHeight(track[idMsg - 1].note)

            times.append(track[idMsg].time)
            frequencies.append(n0.Frequency)
            
            currInterval = Interval.FromNotes(n0, n1)
            standaloneIntervals.append(
                currInterval
            )


    tempSuccessionIntervals = [
        (standaloneIntervals[idInterval - 1].ShortStr(), standaloneIntervals[idInterval].ShortStr())
        for idInterval in range(1, len(standaloneIntervals))
    ]

    successionIntervals = LayeredCounter()
    for elem in tempSuccessionIntervals:
        successionIntervals[elem[0]][elem[1]] += 1
    #print(successionIntervals)

    standaloneIntervals.sort()

    counterStandaloneIntervals = Counter()
    counterStandaloneIntervals.AddListElements([interval.ShortStr() for interval in standaloneIntervals])

    outDeltatimes = Counter()
    outDeltatimes.AddListElements(deltaTimes)

    return times, frequencies, outDeltatimes, counterStandaloneIntervals, successionIntervals


# problem here, if for example 2 hands piano in one channel
def ExcludeChords(track: List[mido.Message]) -> List[mido.Message]:
    # Performing checks to ensure I keep root note
    outTrack = []
    currTime = -1
    savedMsg = None
    for msg in track:
        if msg.time != currTime:
            # push previous message
            if savedMsg is not None:
                outTrack.append(savedMsg)
            savedMsg = msg
            currTime = msg.time
        else:
            if savedMsg.note > msg.note:
                savedMsg = msg
    return outTrack


def IsDrumsTrack(track: mido.MidiTrack) -> bool:
    # drums are on track 9 (mido is 0 indexed)
    for message in track:
        # check if message has a "channel" attribute
        if "channel" in message.__dict__.keys():
            if message.channel == 9:
                return True
    return False


def HandleFrequencyPoints(points: List[Tuple[float, float]]) -> Tuple[List[float], List[float]]:
    # Unzipping tuples for use in plots.js
    return list(zip(*points))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', metavar='N', type=str)
    args = parser.parse_args()

    print(json.dumps(main("TestInputs/" + args.filename)))

