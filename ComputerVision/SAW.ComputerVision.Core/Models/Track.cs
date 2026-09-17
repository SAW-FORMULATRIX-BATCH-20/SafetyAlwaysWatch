using System;

namespace SAW.ComputerVision.Core.Models;

public class Track
{
    public Guid Id { get; }
    public BoundingBox CurrentBox { get; private set; }
    public int FramesSinceLastMatch { get; private set; }
    public int HitStreak { get; private set; }

    public Track(BoundingBox initialBox)
    {
        Id = Guid.NewGuid();
        CurrentBox = initialBox;
        FramesSinceLastMatch = 0;
        HitStreak = 1;
    }

    public void Update(BoundingBox newBox)
    {
        CurrentBox = newBox;
        FramesSinceLastMatch = 0;
        HitStreak++;
    }

    public void MarkMissed()
    {
        FramesSinceLastMatch++;
        HitStreak = 0;
    }
}
