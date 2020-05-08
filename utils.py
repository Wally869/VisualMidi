from __future__ import annotations

import mido
from numpy import median

from copy import deepcopy


# Find threshold to exclude timedeltas outliers
def FindExclusionThreshold(arr: np.ndarray, cutoffMultiplier: int = 4) -> int:
    return median(arr) * cutoffMultiplier



def GetSelectedMessageTypes(track: mido.MidiTrack,
                            allowedTypes: List[str] = ["note_on", "note_off"]
                            ) -> List[mido.Message]:
    return list(
        filter(
            lambda x: x.type in allowedTypes,
            track
        )
    )


def MessageTimeToAbsolute(track: mido.MidiTrack):
    # time attribute for messages is the difference in tick between messages
    # this function computes absolute time for all messages
    time = 0
    outTrack = deepcopy(track)
    for msg in outTrack:
        time += msg.time
        msg.time = time
    return outTrack

"""
class DefaultDict(object):
    def __init__(self, defaultValue = 0):
        self.DefaultValue = 0
        self.dict = {}

    def __get__(self, key):
        if key not in self.dict.keys():
            self.dict[key] = 0
        return self.dict[key]

    def __set__(self,)
"""

class LayeredCounter(dict):
    def __init__(self, defaultValue: str = ""):
        self.DefaultValue = defaultValue
    def __missing__(self, key):
        if self.DefaultValue == "int":
            self[key] = 0
        else:
            self[key] = LayeredCounter("int")
        return self[key]
    def AddListElements(self, elems):
        for elem in elems:
            self[elem] += 1

class Counter(dict):
    def __missing__(self, key):
        self[key] = 0
        return self[key]
    def AddListElements(self, elems):
        for elem in elems:
            self[elem] += 1



