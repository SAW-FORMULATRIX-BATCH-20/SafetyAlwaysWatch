using System.Collections.Generic;
using System.Linq;
using SAW.ComputerVision.Core.Models;

namespace SAW.ComputerVision.Core.Tracking;

public class IouTracker
{
    public double SigmaIou { get; set; } = 0.3;
    public int TMax { get; set; } = 3;
    public int TMin { get; set; } = 2;

    private readonly List<Track> _tracks = new();

    public IReadOnlyList<Track> ActiveTracks => _tracks.AsReadOnly();

    public void Update(IEnumerable<Detection> detections)
    {
        var dets = detections.ToList();
        var unmatchedDetections = new HashSet<int>(Enumerable.Range(0, dets.Count));
        var unmatchedTracks = new HashSet<Track>(_tracks);

        // Precompute IOU matrix
        var matches = new List<(Track Track, int DetectionIndex, double Iou)>();
        for (int i = 0; i < dets.Count; i++)
        {
            foreach (var track in _tracks)
            {
                var iou = track.CurrentBox.CalculateIou(dets[i].Box);
                if (iou >= SigmaIou)
                {
                    matches.Add((track, i, iou));
                }
            }
        }

        // Greedy matching
        matches = matches.OrderByDescending(m => m.Iou).ToList();

        foreach (var match in matches)
        {
            if (unmatchedTracks.Contains(match.Track) && unmatchedDetections.Contains(match.DetectionIndex))
            {
                match.Track.Update(dets[match.DetectionIndex].Box);
                unmatchedTracks.Remove(match.Track);
                unmatchedDetections.Remove(match.DetectionIndex);
            }
        }

        // Update unmatched tracks
        foreach (var track in unmatchedTracks)
        {
            track.MarkMissed();
        }

        // Drop old tracks
        _tracks.RemoveAll(t => t.FramesSinceLastMatch > TMax);

        // Spawn new tracks for unmatched detections
        foreach (var index in unmatchedDetections)
        {
            _tracks.Add(new Track(dets[index].Box));
        }
    }
}
