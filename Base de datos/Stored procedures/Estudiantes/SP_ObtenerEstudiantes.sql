--------------------------------------------------------------------------
-- Autor:       Fabián Vargas
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para obtener los estudiantes
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ObtenerEstudiantes]
    @IN_soloNombre BIT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);

    -- DECLARACIÓN DE VARIABLES
    -- 

    BEGIN TRY

        -- VALIDACIONES
        --

       IF @IN_soloNombre = 1
        BEGIN
            SELECT E.[id], 
            CONCAT(E.[nombre], ' ', E.[apellido1], ' ' ,E.[apellido2]) Nombre
            FROM [Estudiantes] E
            WHERE E.[activo] = 1
            AND E.[eliminado] = 0;
        END
        ELSE
        BEGIN
            SELECT E.id, 
            CONCAT(E.nombre,' \',E.apellido1,' \',E.apellido2) Nombre,
            E.carnet, 
            E.cedula, 
            U.correo, E.activo
            FROM Estudiantes AS E 
            LEFT JOIN Usuarios AS U ON U.id = E.idUsuario
            WHERE E.[eliminado] = 0
        END;

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