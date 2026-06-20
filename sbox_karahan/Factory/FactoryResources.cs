using System.Collections.Generic;
using Sandbox;

namespace Karahan.Factory;

public struct MaterialCost
{
    [Property] public string Material { get; set; }
    [Property] public int Cost { get; set; }
}

public struct StartInventoryItem
{
    [Property] public string Material { get; set; }
    [Property] public int Amount { get; set; }
}

public struct WorkstationTemplateResource
{
    [Property] public string Id { get; set; }
    [Property] public string Name { get; set; }
    [Property] public string Icon { get; set; }
    [Property] public string RequiredSkill { get; set; }
}

public struct MasterTemplateResource
{
    [Property] public string Name { get; set; }
    [Property] public string Hometown { get; set; }
    [Property] public string Skill { get; set; }
    [Property] public string Trait { get; set; }
    [Property, TextArea] public string Bg { get; set; }
    [Property] public List<string> Feuds { get; set; }
}

public struct ActionTemplateResource
{
    [Property] public string Label { get; set; }
    [Property] public bool Correct { get; set; }
}

public struct QuestionTemplateResource
{
    [Property, TextArea] public string Body { get; set; }
    [Property] public List<ActionTemplateResource> Actions { get; set; }
}

public struct BlueprintTemplateResource
{
    [Property] public string Name { get; set; }
    [Property] public List<string> Stages { get; set; }
    [Property] public int Need { get; set; }
    [Property] public List<string> Dependencies { get; set; }
}

public struct OrderTemplateResource
{
    [Property] public string Desc { get; set; }
    [Property] public int Due { get; set; }
    [Property] public int Reward { get; set; }
    [Property] public int Penalty { get; set; }
    [Property] public int RndDays { get; set; }
    [Property] public List<BlueprintTemplateResource> Blueprints { get; set; }
}

[GameResource( "Karahan Factory Template", "khfact", "Template configuration for a Karahan factory type.", Icon = "corporate_fare" )]
public class FactoryTemplateResource : GameResource
{
    [Property] public string FactoryName { get; set; }
    [Property] public string Badge { get; set; }
    [Property] public string BadgeColor { get; set; } = "#3b82f6";
    [Property] public List<string> Materials { get; set; } = new();
    [Property] public List<MaterialCost> MaterialCosts { get; set; } = new();
    [Property] public List<StartInventoryItem> StartInventory { get; set; } = new();
    [Property] public List<WorkstationTemplateResource> Workstations { get; set; } = new();
    [Property] public List<MasterTemplateResource> Masters { get; set; } = new();
    [Property] public List<QuestionTemplateResource> QuestionPool { get; set; } = new();
    [Property] public List<OrderTemplateResource> OrderTemplates { get; set; } = new();
    [Property, TextArea] public string Handbook { get; set; }

    public FactoryTemplate ToTemplate()
    {
        var template = new FactoryTemplate
        {
            Name = FactoryName,
            Badge = Badge,
            BadgeColor = BadgeColor,
            Handbook = Handbook,
            Materials = Materials ?? new()
        };

        if (MaterialCosts != null)
        {
            foreach (var mc in MaterialCosts)
            {
                template.MatCosts[mc.Material] = mc.Cost;
            }
        }

        if (StartInventory != null)
        {
            foreach (var si in StartInventory)
            {
                template.StartInventory[si.Material] = si.Amount;
            }
        }

        if (Workstations != null)
        {
            foreach (var ws in Workstations)
            {
                template.Workstations[ws.Id] = new WorkstationTemplate(ws.Name, ws.Icon, ws.RequiredSkill);
            }
        }

        if (Masters != null)
        {
            foreach (var m in Masters)
            {
                template.Masters.Add(new MasterTemplate(m.Name, m.Hometown, m.Skill, m.Trait, m.Bg, m.Feuds));
            }
        }

        if (QuestionPool != null)
        {
            foreach (var q in QuestionPool)
            {
                var actions = new List<ActionTemplate>();
                if (q.Actions != null)
                {
                    foreach (var act in q.Actions)
                    {
                        actions.Add(new ActionTemplate(act.Label, act.Correct));
                    }
                }
                template.QuestionPool.Add(new QuestionTemplate(q.Body, actions));
            }
        }

        if (OrderTemplates != null)
        {
            foreach (var o in OrderTemplates)
            {
                var blueprints = new List<BlueprintTemplate>();
                if (o.Blueprints != null)
                {
                    foreach (var bp in o.Blueprints)
                    {
                        blueprints.Add(new BlueprintTemplate(bp.Name, bp.Stages ?? new(), bp.Need, bp.Dependencies ?? new()));
                    }
                }
                template.OrderTemplates.Add(new OrderTemplate(o.Desc, o.Due, o.Reward, o.Penalty, o.RndDays, blueprints));
            }
        }

        return template;
    }
}
