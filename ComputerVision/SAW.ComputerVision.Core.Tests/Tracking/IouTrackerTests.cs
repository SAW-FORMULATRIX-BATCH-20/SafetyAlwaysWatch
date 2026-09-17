using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SAW.ComputerVision.Core.Models;
using SAW.ComputerVision.Core.Tracking;

namespace SAW.ComputerVision.Core.Tests.Tracking;

[TestFixture]
public class IouTrackerTests
{
    private IouTracker _tracker;

    [SetUp]
    public void Setup()
    {
        _tracker = new IouTracker
        {
            SigmaIou = 0.3,
            TMax = 3,
            TMin = 2
        };
    }

    [Test]
    public void Update_WithNewDetection_CreatesNewTrack()
    {
        var dets = new List<Detection>
        {
            new Detection(new BoundingBox(10, 10, 50, 50), 0.9)
        };

        _tracker.Update(dets);

        Assert.That(_tracker.ActiveTracks.Count, Is.EqualTo(1));
        Assert.That(_tracker.ActiveTracks[0].HitStreak, Is.EqualTo(1));
        Assert.That(_tracker.ActiveTracks[0].FramesSinceLastMatch, Is.EqualTo(0));
    }

    [Test]
    public void Update_WithOverlappingDetection_UpdatesExistingTrack()
    {
        var dets1 = new List<Detection>
        {
            new Detection(new BoundingBox(10, 10, 50, 50), 0.9)
        };
        _tracker.Update(dets1);
        var trackId = _tracker.ActiveTracks[0].Id;

        var dets2 = new List<Detection>
        {
            new Detection(new BoundingBox(12, 12, 50, 50), 0.9)
        };
        _tracker.Update(dets2);

        Assert.That(_tracker.ActiveTracks.Count, Is.EqualTo(1));
        Assert.That(_tracker.ActiveTracks[0].Id, Is.EqualTo(trackId));
        Assert.That(_tracker.ActiveTracks[0].HitStreak, Is.EqualTo(2));
        Assert.That(_tracker.ActiveTracks[0].FramesSinceLastMatch, Is.EqualTo(0));
        Assert.That(_tracker.ActiveTracks[0].CurrentBox.X, Is.EqualTo(12));
    }

    [Test]
    public void Update_WithNoOverlappingDetection_MarksMissed()
    {
        var dets1 = new List<Detection>
        {
            new Detection(new BoundingBox(10, 10, 50, 50), 0.9)
        };
        _tracker.Update(dets1);

        var dets2 = new List<Detection>
        {
            new Detection(new BoundingBox(100, 100, 50, 50), 0.9)
        };
        _tracker.Update(dets2);

        Assert.That(_tracker.ActiveTracks.Count, Is.EqualTo(2));

        var firstTrack = _tracker.ActiveTracks.First(t => t.CurrentBox.X == 10);
        var secondTrack = _tracker.ActiveTracks.First(t => t.CurrentBox.X == 100);

        Assert.That(firstTrack.FramesSinceLastMatch, Is.EqualTo(1));
        Assert.That(firstTrack.HitStreak, Is.EqualTo(0));

        Assert.That(secondTrack.FramesSinceLastMatch, Is.EqualTo(0));
        Assert.That(secondTrack.HitStreak, Is.EqualTo(1));
    }

    [Test]
    public void Update_MissedBeyondTMax_DropsTrack()
    {
        var dets1 = new List<Detection>
        {
            new Detection(new BoundingBox(10, 10, 50, 50), 0.9)
        };
        _tracker.Update(dets1);

        Assert.That(_tracker.ActiveTracks.Count, Is.EqualTo(1));

        for (int i = 0; i <= _tracker.TMax; i++)
        {
            _tracker.Update(new List<Detection>());
        }

        Assert.That(_tracker.ActiveTracks.Count, Is.EqualTo(0));
    }

    [Test]
    public void CalculateIou_NoOverlap_ReturnsZero()
    {
        var b1 = new BoundingBox(0, 0, 10, 10);
        var b2 = new BoundingBox(20, 20, 10, 10);

        Assert.That(b1.CalculateIou(b2), Is.EqualTo(0));
    }

    [Test]
    public void CalculateIou_ExactOverlap_ReturnsOne()
    {
        var b1 = new BoundingBox(0, 0, 10, 10);
        var b2 = new BoundingBox(0, 0, 10, 10);

        Assert.That(b1.CalculateIou(b2), Is.EqualTo(1));
    }
}
