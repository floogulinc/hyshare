export enum HydrusSortType {
  FileSize = 0,
  Duration = 1,
  ImportTime = 2,
  MIME = 3,
  Random = 4,
  Width = 5,
  Height = 6,
  Ratio = 7,
  NumPixels = 8,
  NumTags = 9,
  MediaViews = 10,
  MediaViewtime = 11,
  ApproxBitrate = 12,
  HasAudio = 13,
  FileModifiedTimestamp = 14,
  Framerate = 15,
  NumFrames = 16,
  //NumCollectionFiles = 17, Not used in API
  LastViewedTime = 18,
  ArchivedTimestamp = 19,
  Hash = 20,
}

export const hydrusSortTypInfo: Record<
  HydrusSortType,
  {
    name: string;
    orderString: {
      asc: string;
      desc: string;
    };
  }
> = {
  0: {
    name: 'File Size',
    orderString: {
      asc: 'Smallest First',
      desc: 'Largest First',
    },
  },
  1: {
    name: 'Duration',
    orderString: {
      asc: 'Shortest First',
      desc: 'Longest First',
    },
  },
  2: {
    name: 'Import Time',
    orderString: {
      asc: 'Oldest First',
      desc: 'Newest First',
    },
  },
  3: {
    name: 'Filetype',
    orderString: null,
  },
  4: {
    name: 'Random',
    orderString: null,
  },
  5: {
    name: 'Width',
    orderString: {
      asc: 'Slimmest First',
      desc: 'Widest First',
    },
  },
  6: {
    name: 'Height',
    orderString: {
      asc: 'Shortest First',
      desc: 'Tallest First',
    },
  },
  7: {
    name: 'Ratio',
    orderString: {
      asc: 'Tallest First',
      desc: 'Widest First',
    },
  },
  8: {
    name: 'Number of Pixels',
    orderString: {
      asc: 'Ascending',
      desc: 'Descending',
    },
  },
  9: {
    name: 'Number of Tags',
    orderString: {
      asc: 'Ascending',
      desc: 'Descending',
    },
  },
  10: {
    name: 'Number of Media Views',
    orderString: {
      asc: 'Ascending',
      desc: 'Descending',
    },
  },
  11: {
    name: 'Total Media Viewtime',
    orderString: {
      asc: 'Ascending',
      desc: 'Descending',
    },
  },
  12: {
    name: 'Approximate Bitrate',
    orderString: {
      asc: 'Smallest First',
      desc: 'Largest First',
    },
  },
  13: {
    name: 'Has Audio',
    orderString: {
      asc: 'Audio First',
      desc: 'Silent First',
    },
  },
  14: {
    name: 'Modified Time',
    orderString: {
      asc: 'Oldest First',
      desc: 'Newest First',
    },
  },
  15: {
    name: 'Framerate',
    orderString: {
      asc: 'Slowest First',
      desc: 'Fastest First',
    },
  },
  16: {
    name: 'Number of Frames',
    orderString: {
      asc: 'Smallest First',
      desc: 'Largest First',
    },
  },
  18: {
    name: 'Last Viewed Time',
    orderString: {
      asc: 'Oldest First',
      desc: 'Newest First',
    },
  },
  19: {
    name: 'Archived Timestamp',
    orderString: {
      asc: 'Oldest First',
      desc: 'Newest First',
    },
  },
  20: {
    name: 'Hash',
    orderString: null,
  },
};
