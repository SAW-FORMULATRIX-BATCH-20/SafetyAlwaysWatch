using System;
using System.Collections.Generic;
using System.Linq;
using SAW.ComputerVision.Core.Inference;
using SAW.ComputerVision.Core.Models;
using SAW.ComputerVision.Core.Tracking;

namespace SAW.ComputerVision.Core.Pipelines;

public class FrameProcessor
{
    private readonly IPersonDetector _personDetector;
    private readonly IPpeDetector _ppeDetector;
    private readonly IFaceDetector _faceDetector;
    private readonly IFaceEmbedder _faceEmbedder;
    private readonly IouTracker _tracker;
    private readonly SpatialAssociator _associator;

    public FrameProcessor(
        IPersonDetector personDetector,
        IPpeDetector ppeDetector,
        IFaceDetector faceDetector,
        IFaceEmbedder faceEmbedder,
        IouTracker tracker,
        SpatialAssociator associator)
    {
        _personDetector = personDetector;
        _ppeDetector = ppeDetector;
        _faceDetector = faceDetector;
        _faceEmbedder = faceEmbedder;
        _tracker = tracker;
        _associator = associator;
    }

    public PipelineOutput ProcessFrame(float[] frameData, int width, int height)
    {
        var output = new PipelineOutput();

        // 1. Detect Persons
        var persons = _personDetector.Detect(frameData, width, height).ToList();

        // 2. Detect PPEs
        var ppes = _ppeDetector.Detect(frameData, width, height).ToList();

        // 3. Associate PPEs to Persons
        var associations = _associator.Associate(persons, ppes);

        // 4. Update Tracker with Person detections
        _tracker.Update(persons);

        var processedPersons = new List<ProcessedPerson>();

        foreach (var track in _tracker.ActiveTracks)
        {
            // Only process newly matched/active tracks (HitStreak > 0)
            // or we could process all. Usually we process all active tracks to maintain state.

            // Find the person detection matching this track's current box, if any
            var matchedPerson = persons.FirstOrDefault(p => p.Box.CalculateIou(track.CurrentBox) > 0.9);

            var processedPerson = new ProcessedPerson
            {
                TrackId = track.Id,
                Box = track.CurrentBox
            };

            if (matchedPerson != null && associations.TryGetValue(matchedPerson, out var associatedPpes))
            {
                processedPerson.PpeDetections = associatedPpes;
            }

            // 5. Face Detection & Embedding
            // TODO: Crop frameData based on track.CurrentBox to pass to IFaceDetector
            // float[] personCrop = CropFrame(frameData, width, height, track.CurrentBox);
            // using dummy frameData for now since cropping is not fully implemented
            var faces = _faceDetector.Detect(frameData, width, height).ToList();
            var bestFace = faces.OrderByDescending(f => f.Confidence).FirstOrDefault();

            if (bestFace != null)
            {
                // TODO: Crop face based on bestFace.Box to pass to IFaceEmbedder
                // float[] faceCrop = CropFrame(personCrop, ...);
                processedPerson.FaceEmbedding = _faceEmbedder.GetEmbedding(frameData, width, height);
            }

            processedPersons.Add(processedPerson);
        }

        output.Persons = processedPersons;

        // Return track IDs of tracks that were just dropped (not directly supported by IouTracker without modifying it to return dropped tracks, 
        // but we can compute it if we keep previous tracks state, or we can leave it empty for now)
        // IouTracker handles its own tracks, LostTrackIds would be tracks that were removed this frame.
        // Let's assume we don't return them here yet, or we could add a property to IouTracker.

        return output;
    }
}
