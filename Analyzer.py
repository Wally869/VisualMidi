from __future__ import annotations

from MidiStructurer.Components import *
#from Plotting import *


import mido
from utils import FindExclusionThreshold, GetSelectedMessageTypes, MessageTimeToAbsolute
from copy import deepcopy

from numpy import array

import json
import argparse

fp = "TestInputs/DQVIII_Reminiscence.mid"
fp2 = "TestInputs/ffxseymourblackmages.mid"


def main(filepath: str = fp):
    # load file
    f = mido.MidiFile(filepath)
    preprocessedTracks = PreprocessTracks(f.tracks)

    # Outliers in term of delta time will need to be excluded
    deltaTimes = []
    for track in preprocessedTracks:
        for i in range(1, len(track)):
            deltaTimes.append(track[i].time - track[i - 1].time)

    deltaTimes = array(deltaTimes)
    exclThreshold = FindExclusionThreshold(arr=deltaTimes[deltaTimes > 0], cutoffMultiplier=5)

    specs = []
    for track in preprocessedTracks:
        percussionsTrack = IsPercussionTrack(track)
        intervals, deltaTimes, freqs = ExtractDataTrack(track, exclThreshold)
        freqs = HandleFrequencyPoints(freqs)
        currSpecs = {
            "Intervals": [interval.ShortStr() for interval in intervals],
            "DeltaTimes": deltaTimes,
            "FrequencyPoints": freqs,
            "IsPercussions": percussionsTrack
        }
        specs.append(currSpecs)

    return specs

# couldn't I just zip?
def HandleFrequencyPoints(points: List[Tuple[float, float]]) -> Tuple[List[float], List[float]]:
    xs = []
    ys = []
    for elem in points:
        xs.append(elem[0])
        ys.append(elem[1])

    return xs, ys

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
    intervals = []
    deltaTimes = []
    freqs = []

    for idMsg in range(1, len(track)):
        dt = track[idMsg].time - track[idMsg - 1].time
        if dt < exclusionThreshold:
            deltaTimes.append(dt)

            n0 = CreateNoteFromHeight(track[idMsg].note)
            n1 = CreateNoteFromHeight(track[idMsg - 1].note)

            #print(n0.ComputeFrequency())
            #print(track[idMsg].time)
            freqs.append((track[idMsg].time, n0.ComputeFrequency()))

            if n0 > n1:
                n0, n1 = n1, n0

            # catch compound interval errors
            try:
                intervals.append(
                    Interval.FromNotes(n0, n1)
                )
            except:
                pass

    return intervals, deltaTimes, freqs


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


def ExcludePercussionTrack(tracks: List[mido.MidiTrack]) -> List[mido.MidiTrack]:
    outTracks = []
    for t in tracks:
        if not IsPercussionTrack(t):
            outTracks.append(t)
    return outTracks


def IsPercussionTrack(track: mido.MidiTrack) -> bool:
    # percussions are on track 9 (mido is 0 indexed)
    for message in track:
        # check if message has a "channel" attribute
        if "channel" in message.__dict__.keys():
            if message.channel == 9:
                return True
    return False




# error with compound intervals
# ignore it for now
def GetIntervals(notes: List[Note]) -> List[Interval]:
    # will be problem if notes at same time
    intervals = []
    for idNote in range(1, len(notes)):
        n0 = notes[idNote - 1]
        n1 = notes[idNote]

        try:
            Interval.FromNotes(n0, n1)
        except:
            # print("Compound interval detected. Ignored")
            pass
    return intervals


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', metavar='N', type=str)
    args = parser.parse_args()

    print(json.dumps(main("TestInputs/" + args.filename)))