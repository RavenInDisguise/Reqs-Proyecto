DELETE [dbo].[Errors];
DELETE [dbo].[Reservas];
DELETE [dbo].[ServiciosDeCubiculo];
DELETE [dbo].[Estudiantes];
DELETE [dbo].[Usuarios];
DELETE [dbo].[Cubiculos];
DELETE [dbo].[ServiciosEspeciales];
DELETE [dbo].[TiposUsuario];
DELETE [dbo].[EstadosCubiculo];

DBCC CHECKIDENT ('Errors', RESEED, 0);
DBCC CHECKIDENT ('Reservas', RESEED, 0);
DBCC CHECKIDENT ('ServiciosDeCubiculo', RESEED, 0);
DBCC CHECKIDENT ('Estudiantes', RESEED, 0);
DBCC CHECKIDENT ('Usuarios', RESEED, 0);
DBCC CHECKIDENT ('Cubiculos', RESEED, 0);
DBCC CHECKIDENT ('ServiciosEspeciales', RESEED, 0);
DBCC CHECKIDENT ('TiposUsuario', RESEED, 0);
DBCC CHECKIDENT ('EstadosCubiculo', RESEED, 0);