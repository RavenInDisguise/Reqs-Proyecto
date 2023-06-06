--------------------------------------------------------------------------
-- Autor:       Fabián Vargas
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para eliminar un estudiante
-- Códigos de error:
--  - [ninguno]
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_EliminarEstudiante]
    @IN_idEstudiante INT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    BEGIN TRY

        -- DECLARACIÓN DE VARIABLES
        -- 
        -- VALIDACIONES

        IF NOT EXISTS( SELECT 1 
                       FROM [Estudiantes] E 
                       WHERE E.[id] = @In_idEstudiante
                       AND E.[eliminado] = 0)
        BEGIN
            RAISERROR ('No existe ningun estudiante con el ID %d', 16, 1, @In_idEstudiante);
        END

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

        UPDATE Estudiantes SET eliminado = 1 WHERE id = @In_idEstudiante;

        UPDATE R
        SET R.[activo] = 0,
            R.[confirmado] = 0,
            R.[eliminada] = 1
        FROM [dbo].[Reservas] R
        WHERE R.[idEstudiante] = @In_idEstudiante;

        -- COMMIT DE LA TRANSACCIÓN
        IF @transaccion_iniciada = 1
        BEGIN
            COMMIT TRANSACTION;
        END;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @transaccion_iniciada = 1
        BEGIN
            ROLLBACK;
        END;

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