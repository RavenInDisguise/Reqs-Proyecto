--------------------------------------------------------------------------
-- Autor:       Fabián Vargas
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para obtener un estudiante
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ObtenerEstudiante]
    @IN_idEstudiante INT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);

    -- DECLARACIÓN DE VARIABLES
    -- 

    BEGIN TRY

        -- VALIDACIONES

        IF NOT EXISTS( SELECT 1 
                   FROM [Estudiantes] E
                   WHERE E.[id] = @IN_idEstudiante
                   AND E.[eliminado] = 0)
        BEGIN
            RAISERROR('No existe un estudiante con el ID %d', 16, 1, @IN_idEstudiante)
        END

        SELECT 
                  E.id,
                  E.nombre,
                  E.apellido1,
                  E.apellido2,
                  E.cedula,
                  E.carnet,
                  E.fechaDeNacimiento fechaDeNacimiento,
                  U.correo
                FROM Estudiantes AS E 
                LEFT JOIN Usuarios AS U 
                ON U.id = E.idUsuario
                WHERE E.id = @IN_idEstudiante

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;