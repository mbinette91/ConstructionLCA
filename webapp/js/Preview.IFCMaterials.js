/*
* Author: Mathieu Binette
* Features:
*   - Material assignments based on different criterias
* To-do:
*   - IFCMaterials.INFO should be in a database of some sort.
*   - IFCMaterials.classToMaterial should be in a database of some sort.
*/

IFCMaterials =  {}
IFCMaterials.INFO = [
    {"name": "default", "diffuse":{"color":[0.8,0.8,0.8]}, "specular":{"color":[0.4,0.4,0.4]}}, // Default
    {"name": "brick", "diffuse":{"color":[0.8,0.0,0.0]}, "specular":{"color":[0.4,0.4,0.4]}},
    {"name": "beton", "diffuse":{"color":[0.9,0.9,0.9]}, "specular":{"color":[0.4,0.4,0.4]}},
    {"name": "wood", "diffuse":{"color":rgb(153,102,51)}, "specular":"default"},
    {"name": "glass", "diffuse":{"color":rgb(204,255,255)}, "specular":"default", "opacity":0.5},
    {"name": "metal", "diffuse":{"color":rgb(220,220,220)}},
    {"name": "invisible", "opacity":0},
];
IFCMaterials.classToMaterial = {
        "IfcBeam": "wood",
        "IfcDoor": "wood",
        "IfcSlab": "wood",
        "IfcColumn": "wood",
        "IfcRailing": "metal",
        "IfcWall": "metal",
        "IfcWallStandardCase": "metal",
        "IfcWindow": "glass",
        "IfcPlate": "glass", // Not true, you need to check the material here.
        "IfcSpace": "invisible",
};
IFCMaterials.get = function(space) {
    return new IFCMaterialsManager(space);
}

function IFCMaterialsManager(space){
    this.materials = {};
    for (i = 0; i < IFCMaterials.INFO.length; i++) {
        var info = IFCMaterials.INFO[i];
        if(info.specular == "default")
            info.specular = this.materials["default"].specular;
        this.materials[IFCMaterials.INFO[i].name] = new material3d(space, info);
    }
    this.c2m = IFCMaterials.classToMaterial; // Classes to Materials associations
}
IFCMaterialsManager.prototype.initialize = function() {
    console.log(this)
    for(var i in this.materials)
        this.materials[i].shader.update(this.materials[i]);
}

IFCMaterialsManager.prototype.search = function(info){
    var className = info.className;
    if(className && this.c2m[className])
        return this.materials[this.c2m[className]];

    var materialName = info.materialName;
    if(materialName) {
        if(materialName.includes("beton"))
            return this.materials["beton"];
        else if(materialName.includes("brick"))
            return this.materials["brick"];
    }

    return this.materials["default"];
}