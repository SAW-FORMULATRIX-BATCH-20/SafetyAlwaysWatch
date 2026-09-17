using System.Collections.Generic;
using System.Linq;
using Moq;
using NUnit.Framework;
using SAW.ComputerVision.Core.Inference;
using SAW.ComputerVision.Core.Models;
using SAW.ComputerVision.Core.Pipelines;
using SAW.ComputerVision.Core.Tracking;

namespace SAW.ComputerVision.Core.Tests.Pipelines;

[TestFixture]
public class FrameProcessorTests
{
    [Test]
    public void ProcessFrame_ShouldRunFullPipelineAndReturnOutput()
    {
        // Arrange
        var mockPersonDetector = new Mock<IPersonDetector>();
        var mockPpeDetector = new Mock<IPpeDetector>();
        var mockFaceDetector = new Mock<IFaceDetector>();
        var mockFaceEmbedder = new Mock<IFaceEmbedder>();
        var tracker = new IouTracker { SigmaIou = 0.3, TMax = 3, TMin = 2 };
        var associator = new SpatialAssociator();

        var personBox = new BoundingBox(10, 10, 100, 200);
        var ppeBox = new BoundingBox(20, 20, 30, 30);

        var personDetection = new Detection(personBox, 0.9, 0);
        var ppeDetection = new Detection(ppeBox, 0.8, 1);
        var faceDetection = new Detection(new BoundingBox(30, 30, 20, 20), 0.9, 2);

        float[] fakeFrameData = new float[100];

        mockPersonDetector.Setup(d => d.Detect(fakeFrameData, 1920, 1080))
            .Returns(new List<Detection> { personDetection });

        mockPpeDetector.Setup(d => d.Detect(fakeFrameData, 1920, 1080))
            .Returns(new List<Detection> { ppeDetection });

        mockFaceDetector.Setup(d => d.Detect(fakeFrameData, 1920, 1080))
            .Returns(new List<Detection> { faceDetection });

        mockFaceEmbedder.Setup(e => e.GetEmbedding(fakeFrameData, 1920, 1080))
            .Returns(new float[] { 0.1f, 0.2f, 0.3f });

        var processor = new FrameProcessor(
            mockPersonDetector.Object,
            mockPpeDetector.Object,
            mockFaceDetector.Object,
            mockFaceEmbedder.Object,
            tracker,
            associator);

        // Act
        var output = processor.ProcessFrame(fakeFrameData, 1920, 1080);

        // Assert
        Assert.That(output, Is.Not.Null);
        Assert.That(output.Persons, Has.Exactly(1).Items);

        var processedPerson = output.Persons.First();
        Assert.That(processedPerson.Box.X, Is.EqualTo(personBox.X));
        Assert.That(processedPerson.Box.Y, Is.EqualTo(personBox.Y));
        Assert.That(processedPerson.PpeDetections, Has.Exactly(1).Items);
        Assert.That(processedPerson.PpeDetections.First(), Is.EqualTo(ppeDetection));

        Assert.That(processedPerson.FaceEmbedding, Is.Not.Null);
        Assert.That(processedPerson.FaceEmbedding.Length, Is.EqualTo(3));
        Assert.That(processedPerson.FaceEmbedding[0], Is.EqualTo(0.1f));
    }
}
