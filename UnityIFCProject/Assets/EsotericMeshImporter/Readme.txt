Esoteric Mesh Importer v1.0
¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
While Unity supports most common 3D formats, a lot of them are left out 
because they are less widely used, legacy, or bound to a specific domain
of application.

Esoteric mesh importer is here to remediate to this situation by adding 
support for more than 20 other 3D formats.

The following are supported:

Unreal ( .3d )
Valve Model ( .smd )
Starcraft II M3 ( .m3 )
Quake I ( .mdl )
Quake II ( .md2 )
Quake III Mesh ( .md3 )
Quake III Map/BSP ( .pk3 )
Doom 3 ( .md5mesh )
DirectX X ( .x )
Milkshape 3D ( .ms3d )
Terragen Terrain ( .ter )
PovRAY Raw ( .raw )
Ogre XML ( mesh.xml )
Irrlicht Mesh ( .irrmesh )
XGL ( .xgl,.zgl )
AC3D ( .ac )
Industry Foundation Classes (IFC/Step) ( .ifc )
Stanford Polygon Library ( .ply )
BlitzBasic 3D ( .b3d )
Quick3D ( .q3d,.q3s )
Neutral File Format ( .nff )
Sense8 WorldToolKit ( .nff )
Object File Format ( .off )

Note that importation of animations is not supported by this plugin.

The importation is entirely automatic, as with any format that Unity
supports by default.

Installation
¯¯¯¯¯¯¯¯¯¯¯¯
After having imported this package into your unity project:

1) Copy Assets/EsotericMeshImporter/Editor/Assimp32.dll at the root of your project.
   (The directory where Assets, Library, and ProjectSettings folders are)

2) Restart Unity

Support
¯¯¯¯¯¯¯
If you have the following error in the console:

NotImplementedException: The requested feature is not implemented.

It means that Unity is unable to find Assimp32.dll, and this is due to the fact
that you didn't copied it to your project folder, or that you didn't restarted 
Unity.

For any questions you can write at oli3012@gmail.com

You can also find us on the Unity forums.
