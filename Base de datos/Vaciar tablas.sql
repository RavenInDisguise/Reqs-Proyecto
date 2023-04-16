DELETE [dbo].[Errors];
DELETE [dbo].[Reservas];
DELETE [dbo].[ServiciosDeCubiculo];
DELETE [dbo].[Estudiantes];
DELETE [dbo].[Usuarios];
DELETE [dbo].[Cubiculos];
DELETE [dbo].[ServiciosEspeciales];
DELETE [dbo].[TiposUsuario];
DELETE [dbo].[EstadosCubiculo];

DBCC CHECKIDENT ('Errors', RESEED, 1);
DBCC CHECKIDENT ('Reservas', RESEED, 1);
DBCC CHECKIDENT ('ServiciosDeCubiculo', RESEED, 1);
DBCC CHECKIDENT ('Estudiantes', RESEED, 1);
DBCC CHECKIDENT ('Usuarios', RESEED, 1);
DBCC CHECKIDENT ('Cubiculos', RESEED, 1);
DBCC CHECKIDENT ('ServiciosEspeciales', RESEED, 1);
DBCC CHECKIDENT ('TiposUsuario', RESEED, 1);
DBCC CHECKIDENT ('EstadosCubiculo', RESEED, 1);