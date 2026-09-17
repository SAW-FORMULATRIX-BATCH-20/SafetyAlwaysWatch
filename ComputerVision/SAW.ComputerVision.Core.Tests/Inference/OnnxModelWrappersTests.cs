using System;
using System.IO;
using System.Linq;
using NUnit.Framework;
using SAW.ComputerVision.Core.Inference;

namespace SAW.ComputerVision.Core.Tests.Inference;

[TestFixture]
public class OnnxModelWrappersTests
{
    private string GetModelPath(string filename)
    {
        var basePath = AppDomain.CurrentDomain.BaseDirectory;
        var modelPath = Path.GetFullPath(Path.Combine(basePath, "../../../../../V1/NETFace.Attendance.Api/assets/models", filename));
        return modelPath;
    }

    [Test]
    public void PersonDetector_Should_Load_And_Run()
    {
        // Using yunet.onnx as a placeholder since person/ppe models are not yet in the repo
        var modelPath = GetModelPath("yunet.onnx");
        if (!File.Exists(modelPath)) Assert.Ignore("Model file not found: " + modelPath);

        using var detector = new PersonDetector(modelPath);
        detector.Load();

        var dummyData = new float[3 * 224 * 224];
        var results = detector.Detect(dummyData, 224, 224);

        Assert.That(results, Is.Not.Null);
    }

    [Test]
    public void PpeDetector_Should_Load_And_Run()
    {
        var modelPath = GetModelPath("yunet.onnx");
        if (!File.Exists(modelPath)) Assert.Ignore("Model file not found: " + modelPath);

        using var detector = new PpeDetector(modelPath);
        detector.Load();

        var dummyData = new float[3 * 224 * 224];
        var results = detector.Detect(dummyData, 224, 224);

        Assert.That(results, Is.Not.Null);
    }

    [Test]
    public void FaceDetector_Should_Load_And_Run()
    {
        var modelPath = GetModelPath("yunet.onnx");
        if (!File.Exists(modelPath)) Assert.Ignore("Model file not found: " + modelPath);

        using var detector = new FaceDetector(modelPath);
        detector.Load();

        var dummyData = new float[3 * 320 * 320];
        var results = detector.Detect(dummyData, 320, 320);

        Assert.That(results, Is.Not.Null);
    }

    [Test]
    public void FaceEmbedder_Should_Load_And_Run()
    {
        var modelPath = GetModelPath("sface.onnx");
        if (!File.Exists(modelPath)) Assert.Ignore("Model file not found: " + modelPath);

        using var embedder = new FaceEmbedder(modelPath);
        embedder.Load();

        var dummyData = new float[3 * 112 * 112];
        var results = embedder.GetEmbedding(dummyData, 112, 112);

        Assert.That(results, Is.Not.Null);
    }
}
