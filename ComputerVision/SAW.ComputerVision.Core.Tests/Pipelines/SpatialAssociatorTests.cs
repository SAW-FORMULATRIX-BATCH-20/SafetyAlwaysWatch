using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SAW.ComputerVision.Core.Models;
using SAW.ComputerVision.Core.Pipelines;

namespace SAW.ComputerVision.Core.Tests.Pipelines;

[TestFixture]
public class SpatialAssociatorTests
{
    [Test]
    public void Associate_ShouldMatchPpeToPerson_WhenPpeIsInsidePersonBox()
    {
        // Arrange
        var associator = new SpatialAssociator { IoaThreshold = 0.5 };

        var person1 = new Detection(new BoundingBox(10, 10, 100, 200), 0.9, 0); // Person
        var person2 = new Detection(new BoundingBox(200, 200, 100, 200), 0.9, 0); // Person

        var ppe1 = new Detection(new BoundingBox(20, 20, 30, 30), 0.8, 1); // Inside person1
        var ppe2 = new Detection(new BoundingBox(210, 210, 30, 30), 0.8, 1); // Inside person2
        var ppeOutside = new Detection(new BoundingBox(500, 500, 30, 30), 0.8, 1); // Outside

        var persons = new List<Detection> { person1, person2 };
        var ppes = new List<Detection> { ppe1, ppe2, ppeOutside };

        // Act
        var result = associator.Associate(persons, ppes);

        // Assert
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[person1], Contains.Item(ppe1));
        Assert.That(result[person2], Contains.Item(ppe2));
        Assert.That(result.SelectMany(x => x.Value), Does.Not.Contain(ppeOutside));
    }

    [Test]
    public void Associate_ShouldAssignToPersonWithHighestIoa_WhenPpeOverlapsMultiple()
    {
        // Arrange
        var associator = new SpatialAssociator { IoaThreshold = 0.1 };

        // Two persons overlapping significantly
        var person1 = new Detection(new BoundingBox(10, 10, 100, 200), 0.9, 0);
        var person2 = new Detection(new BoundingBox(50, 10, 100, 200), 0.9, 0);

        // PPE is mostly in person2
        var ppe = new Detection(new BoundingBox(110, 50, 30, 30), 0.8, 1);

        var persons = new List<Detection> { person1, person2 };
        var ppes = new List<Detection> { ppe };

        // Act
        var result = associator.Associate(persons, ppes);

        // Assert
        Assert.That(result[person1], Is.Empty);
        Assert.That(result[person2], Has.Count.EqualTo(1));
        Assert.That(result[person2].First(), Is.EqualTo(ppe));
    }
}
