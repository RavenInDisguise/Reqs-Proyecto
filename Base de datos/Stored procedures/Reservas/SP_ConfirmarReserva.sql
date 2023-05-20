--------------------------------------------------------------------------
-- Autor:       Fabián Vargas
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para confirmar las reservas
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ConfirmarReserva]
    @IN_idReserva           INT,
    @IN_idEstudiante        INT = NULL,
    @IN_tipoUsuario         VARCHAR(16)
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @DESCRIPCION_ADMIN VARCHAR(32) = 'Administrador';

    BEGIN TRY

        -- VALIDACIONES
        -- ¿Existe la reserva?
        IF NOT EXISTS(
            SELECT  1
            FROM    [dbo].[Reservas] R
            WHERE   R.[id] = @IN_idReserva
                    AND R.[eliminada] = 0
        )
        BEGIN
            RAISERROR('No existe ninguna reserva con el ID %d', 16, 1, @IN_idReserva);
        END;

        -- ¿Tiene permisos para eliminar su reserva?
        -- (es administrador o es un estudiante borrando una de sus reservas)
        IF      @IN_tipoUsuario != @DESCRIPCION_ADMIN
            AND (
                SELECT  R.[idEstudiante]
                FROM    [dbo].[Reservas] R
                WHERE   R.[id] = @IN_idReserva
            ) != @IN_idEstudiante
        BEGIN
            RAISERROR('No tiene autorización para confirmar esta reserva', 16, 1);
        END;
        
        -- ¿Está activa la reserva?
        IF NOT EXISTS(
            SELECT  1
            FROM    [dbo].[Reservas] R
            WHERE   R.[id] = @IN_idReserva
                    AND R.[activo] = 1
        )
        BEGIN
            RAISERROR('No se puede confirmar la reserva %d porque está inactiva', 16, 1, @IN_idReserva);
        END;

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;
      
        UPDATE Reservas 
        SET confirmado = 1 
        WHERE id = @IN_idReserva
  
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