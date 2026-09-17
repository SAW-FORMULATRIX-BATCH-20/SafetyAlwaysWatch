using System.Collections.Generic;
using System.Linq;
using SAW.ComputerVision.Core.Models;

namespace SAW.ComputerVision.Core.Pipelines;

public class SpatialAssociator
{
    public double IoaThreshold { get; set; } = 0.5;

    public Dictionary<Detection, List<Detection>> Associate(IEnumerable<Detection> persons, IEnumerable<Detection> ppes)
    {
        var personList = persons.ToList();
        var ppeList = ppes.ToList();
        var associations = new Dictionary<Detection, List<Detection>>();

        foreach (var person in personList)
        {
            associations[person] = new List<Detection>();
        }

        foreach (var ppe in ppeList)
        {
            Detection? bestPerson = null;
            double maxIoa = 0;

            foreach (var person in personList)
            {
                var ioa = ppe.Box.CalculateIoa(person.Box);
                if (ioa >= IoaThreshold && ioa > maxIoa)
                {
                    maxIoa = ioa;
                    bestPerson = person;
                }
            }

            if (bestPerson != null)
            {
                associations[bestPerson].Add(ppe);
            }
        }

        return associations;
    }
}
